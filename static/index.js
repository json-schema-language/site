(function () {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var VNode = function VNode() {};

    var options = {};

    var stack = [];

    var EMPTY_CHILDREN = [];

    function h(nodeName, attributes) {
    	var children = EMPTY_CHILDREN,
    	    lastSimple,
    	    child,
    	    simple,
    	    i;
    	for (i = arguments.length; i-- > 2;) {
    		stack.push(arguments[i]);
    	}
    	if (attributes && attributes.children != null) {
    		if (!stack.length) stack.push(attributes.children);
    		delete attributes.children;
    	}
    	while (stack.length) {
    		if ((child = stack.pop()) && child.pop !== undefined) {
    			for (i = child.length; i--;) {
    				stack.push(child[i]);
    			}
    		} else {
    			if (typeof child === 'boolean') child = null;

    			if (simple = typeof nodeName !== 'function') {
    				if (child == null) child = '';else if (typeof child === 'number') child = String(child);else if (typeof child !== 'string') simple = false;
    			}

    			if (simple && lastSimple) {
    				children[children.length - 1] += child;
    			} else if (children === EMPTY_CHILDREN) {
    				children = [child];
    			} else {
    				children.push(child);
    			}

    			lastSimple = simple;
    		}
    	}

    	var p = new VNode();
    	p.nodeName = nodeName;
    	p.children = children;
    	p.attributes = attributes == null ? undefined : attributes;
    	p.key = attributes == null ? undefined : attributes.key;

    	return p;
    }

    function extend(obj, props) {
      for (var i in props) {
        obj[i] = props[i];
      }return obj;
    }

    function applyRef(ref, value) {
      if (ref != null) {
        if (typeof ref == 'function') ref(value);else ref.current = value;
      }
    }

    var defer = typeof Promise == 'function' ? Promise.resolve().then.bind(Promise.resolve()) : setTimeout;

    var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;

    var items = [];

    function enqueueRender(component) {
    	if (!component._dirty && (component._dirty = true) && items.push(component) == 1) {
    		(defer)(rerender);
    	}
    }

    function rerender() {
    	var p;
    	while (p = items.pop()) {
    		if (p._dirty) renderComponent(p);
    	}
    }

    function isSameNodeType(node, vnode, hydrating) {
    	if (typeof vnode === 'string' || typeof vnode === 'number') {
    		return node.splitText !== undefined;
    	}
    	if (typeof vnode.nodeName === 'string') {
    		return !node._componentConstructor && isNamedNode(node, vnode.nodeName);
    	}
    	return hydrating || node._componentConstructor === vnode.nodeName;
    }

    function isNamedNode(node, nodeName) {
    	return node.normalizedNodeName === nodeName || node.nodeName.toLowerCase() === nodeName.toLowerCase();
    }

    function getNodeProps(vnode) {
    	var props = extend({}, vnode.attributes);
    	props.children = vnode.children;

    	var defaultProps = vnode.nodeName.defaultProps;
    	if (defaultProps !== undefined) {
    		for (var i in defaultProps) {
    			if (props[i] === undefined) {
    				props[i] = defaultProps[i];
    			}
    		}
    	}

    	return props;
    }

    function createNode(nodeName, isSvg) {
    	var node = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', nodeName) : document.createElement(nodeName);
    	node.normalizedNodeName = nodeName;
    	return node;
    }

    function removeNode(node) {
    	var parentNode = node.parentNode;
    	if (parentNode) parentNode.removeChild(node);
    }

    function setAccessor(node, name, old, value, isSvg) {
    	if (name === 'className') name = 'class';

    	if (name === 'key') ; else if (name === 'ref') {
    		applyRef(old, null);
    		applyRef(value, node);
    	} else if (name === 'class' && !isSvg) {
    		node.className = value || '';
    	} else if (name === 'style') {
    		if (!value || typeof value === 'string' || typeof old === 'string') {
    			node.style.cssText = value || '';
    		}
    		if (value && typeof value === 'object') {
    			if (typeof old !== 'string') {
    				for (var i in old) {
    					if (!(i in value)) node.style[i] = '';
    				}
    			}
    			for (var i in value) {
    				node.style[i] = typeof value[i] === 'number' && IS_NON_DIMENSIONAL.test(i) === false ? value[i] + 'px' : value[i];
    			}
    		}
    	} else if (name === 'dangerouslySetInnerHTML') {
    		if (value) node.innerHTML = value.__html || '';
    	} else if (name[0] == 'o' && name[1] == 'n') {
    		var useCapture = name !== (name = name.replace(/Capture$/, ''));
    		name = name.toLowerCase().substring(2);
    		if (value) {
    			if (!old) node.addEventListener(name, eventProxy, useCapture);
    		} else {
    			node.removeEventListener(name, eventProxy, useCapture);
    		}
    		(node._listeners || (node._listeners = {}))[name] = value;
    	} else if (name !== 'list' && name !== 'type' && !isSvg && name in node) {
    		try {
    			node[name] = value == null ? '' : value;
    		} catch (e) {}
    		if ((value == null || value === false) && name != 'spellcheck') node.removeAttribute(name);
    	} else {
    		var ns = isSvg && name !== (name = name.replace(/^xlink:?/, ''));

    		if (value == null || value === false) {
    			if (ns) node.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase());else node.removeAttribute(name);
    		} else if (typeof value !== 'function') {
    			if (ns) node.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value);else node.setAttribute(name, value);
    		}
    	}
    }

    function eventProxy(e) {
    	return this._listeners[e.type](e);
    }

    var mounts = [];

    var diffLevel = 0;

    var isSvgMode = false;

    var hydrating = false;

    function flushMounts() {
    	var c;
    	while (c = mounts.shift()) {
    		if (c.componentDidMount) c.componentDidMount();
    	}
    }

    function diff(dom, vnode, context, mountAll, parent, componentRoot) {
    	if (!diffLevel++) {
    		isSvgMode = parent != null && parent.ownerSVGElement !== undefined;

    		hydrating = dom != null && !('__preactattr_' in dom);
    	}

    	var ret = idiff(dom, vnode, context, mountAll, componentRoot);

    	if (parent && ret.parentNode !== parent) parent.appendChild(ret);

    	if (! --diffLevel) {
    		hydrating = false;

    		if (!componentRoot) flushMounts();
    	}

    	return ret;
    }

    function idiff(dom, vnode, context, mountAll, componentRoot) {
    	var out = dom,
    	    prevSvgMode = isSvgMode;

    	if (vnode == null || typeof vnode === 'boolean') vnode = '';

    	if (typeof vnode === 'string' || typeof vnode === 'number') {
    		if (dom && dom.splitText !== undefined && dom.parentNode && (!dom._component || componentRoot)) {
    			if (dom.nodeValue != vnode) {
    				dom.nodeValue = vnode;
    			}
    		} else {
    			out = document.createTextNode(vnode);
    			if (dom) {
    				if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
    				recollectNodeTree(dom, true);
    			}
    		}

    		out['__preactattr_'] = true;

    		return out;
    	}

    	var vnodeName = vnode.nodeName;
    	if (typeof vnodeName === 'function') {
    		return buildComponentFromVNode(dom, vnode, context, mountAll);
    	}

    	isSvgMode = vnodeName === 'svg' ? true : vnodeName === 'foreignObject' ? false : isSvgMode;

    	vnodeName = String(vnodeName);
    	if (!dom || !isNamedNode(dom, vnodeName)) {
    		out = createNode(vnodeName, isSvgMode);

    		if (dom) {
    			while (dom.firstChild) {
    				out.appendChild(dom.firstChild);
    			}
    			if (dom.parentNode) dom.parentNode.replaceChild(out, dom);

    			recollectNodeTree(dom, true);
    		}
    	}

    	var fc = out.firstChild,
    	    props = out['__preactattr_'],
    	    vchildren = vnode.children;

    	if (props == null) {
    		props = out['__preactattr_'] = {};
    		for (var a = out.attributes, i = a.length; i--;) {
    			props[a[i].name] = a[i].value;
    		}
    	}

    	if (!hydrating && vchildren && vchildren.length === 1 && typeof vchildren[0] === 'string' && fc != null && fc.splitText !== undefined && fc.nextSibling == null) {
    		if (fc.nodeValue != vchildren[0]) {
    			fc.nodeValue = vchildren[0];
    		}
    	} else if (vchildren && vchildren.length || fc != null) {
    			innerDiffNode(out, vchildren, context, mountAll, hydrating || props.dangerouslySetInnerHTML != null);
    		}

    	diffAttributes(out, vnode.attributes, props);

    	isSvgMode = prevSvgMode;

    	return out;
    }

    function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
    	var originalChildren = dom.childNodes,
    	    children = [],
    	    keyed = {},
    	    keyedLen = 0,
    	    min = 0,
    	    len = originalChildren.length,
    	    childrenLen = 0,
    	    vlen = vchildren ? vchildren.length : 0,
    	    j,
    	    c,
    	    f,
    	    vchild,
    	    child;

    	if (len !== 0) {
    		for (var i = 0; i < len; i++) {
    			var _child = originalChildren[i],
    			    props = _child['__preactattr_'],
    			    key = vlen && props ? _child._component ? _child._component.__key : props.key : null;
    			if (key != null) {
    				keyedLen++;
    				keyed[key] = _child;
    			} else if (props || (_child.splitText !== undefined ? isHydrating ? _child.nodeValue.trim() : true : isHydrating)) {
    				children[childrenLen++] = _child;
    			}
    		}
    	}

    	if (vlen !== 0) {
    		for (var i = 0; i < vlen; i++) {
    			vchild = vchildren[i];
    			child = null;

    			var key = vchild.key;
    			if (key != null) {
    				if (keyedLen && keyed[key] !== undefined) {
    					child = keyed[key];
    					keyed[key] = undefined;
    					keyedLen--;
    				}
    			} else if (min < childrenLen) {
    					for (j = min; j < childrenLen; j++) {
    						if (children[j] !== undefined && isSameNodeType(c = children[j], vchild, isHydrating)) {
    							child = c;
    							children[j] = undefined;
    							if (j === childrenLen - 1) childrenLen--;
    							if (j === min) min++;
    							break;
    						}
    					}
    				}

    			child = idiff(child, vchild, context, mountAll);

    			f = originalChildren[i];
    			if (child && child !== dom && child !== f) {
    				if (f == null) {
    					dom.appendChild(child);
    				} else if (child === f.nextSibling) {
    					removeNode(f);
    				} else {
    					dom.insertBefore(child, f);
    				}
    			}
    		}
    	}

    	if (keyedLen) {
    		for (var i in keyed) {
    			if (keyed[i] !== undefined) recollectNodeTree(keyed[i], false);
    		}
    	}

    	while (min <= childrenLen) {
    		if ((child = children[childrenLen--]) !== undefined) recollectNodeTree(child, false);
    	}
    }

    function recollectNodeTree(node, unmountOnly) {
    	var component = node._component;
    	if (component) {
    		unmountComponent(component);
    	} else {
    		if (node['__preactattr_'] != null) applyRef(node['__preactattr_'].ref, null);

    		if (unmountOnly === false || node['__preactattr_'] == null) {
    			removeNode(node);
    		}

    		removeChildren(node);
    	}
    }

    function removeChildren(node) {
    	node = node.lastChild;
    	while (node) {
    		var next = node.previousSibling;
    		recollectNodeTree(node, true);
    		node = next;
    	}
    }

    function diffAttributes(dom, attrs, old) {
    	var name;

    	for (name in old) {
    		if (!(attrs && attrs[name] != null) && old[name] != null) {
    			setAccessor(dom, name, old[name], old[name] = undefined, isSvgMode);
    		}
    	}

    	for (name in attrs) {
    		if (name !== 'children' && name !== 'innerHTML' && (!(name in old) || attrs[name] !== (name === 'value' || name === 'checked' ? dom[name] : old[name]))) {
    			setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
    		}
    	}
    }

    var recyclerComponents = [];

    function createComponent(Ctor, props, context) {
    	var inst,
    	    i = recyclerComponents.length;

    	if (Ctor.prototype && Ctor.prototype.render) {
    		inst = new Ctor(props, context);
    		Component.call(inst, props, context);
    	} else {
    		inst = new Component(props, context);
    		inst.constructor = Ctor;
    		inst.render = doRender;
    	}

    	while (i--) {
    		if (recyclerComponents[i].constructor === Ctor) {
    			inst.nextBase = recyclerComponents[i].nextBase;
    			recyclerComponents.splice(i, 1);
    			return inst;
    		}
    	}

    	return inst;
    }

    function doRender(props, state, context) {
    	return this.constructor(props, context);
    }

    function setComponentProps(component, props, renderMode, context, mountAll) {
    	if (component._disable) return;
    	component._disable = true;

    	component.__ref = props.ref;
    	component.__key = props.key;
    	delete props.ref;
    	delete props.key;

    	if (typeof component.constructor.getDerivedStateFromProps === 'undefined') {
    		if (!component.base || mountAll) {
    			if (component.componentWillMount) component.componentWillMount();
    		} else if (component.componentWillReceiveProps) {
    			component.componentWillReceiveProps(props, context);
    		}
    	}

    	if (context && context !== component.context) {
    		if (!component.prevContext) component.prevContext = component.context;
    		component.context = context;
    	}

    	if (!component.prevProps) component.prevProps = component.props;
    	component.props = props;

    	component._disable = false;

    	if (renderMode !== 0) {
    		if (renderMode === 1 || options.syncComponentUpdates !== false || !component.base) {
    			renderComponent(component, 1, mountAll);
    		} else {
    			enqueueRender(component);
    		}
    	}

    	applyRef(component.__ref, component);
    }

    function renderComponent(component, renderMode, mountAll, isChild) {
    	if (component._disable) return;

    	var props = component.props,
    	    state = component.state,
    	    context = component.context,
    	    previousProps = component.prevProps || props,
    	    previousState = component.prevState || state,
    	    previousContext = component.prevContext || context,
    	    isUpdate = component.base,
    	    nextBase = component.nextBase,
    	    initialBase = isUpdate || nextBase,
    	    initialChildComponent = component._component,
    	    skip = false,
    	    snapshot = previousContext,
    	    rendered,
    	    inst,
    	    cbase;

    	if (component.constructor.getDerivedStateFromProps) {
    		state = extend(extend({}, state), component.constructor.getDerivedStateFromProps(props, state));
    		component.state = state;
    	}

    	if (isUpdate) {
    		component.props = previousProps;
    		component.state = previousState;
    		component.context = previousContext;
    		if (renderMode !== 2 && component.shouldComponentUpdate && component.shouldComponentUpdate(props, state, context) === false) {
    			skip = true;
    		} else if (component.componentWillUpdate) {
    			component.componentWillUpdate(props, state, context);
    		}
    		component.props = props;
    		component.state = state;
    		component.context = context;
    	}

    	component.prevProps = component.prevState = component.prevContext = component.nextBase = null;
    	component._dirty = false;

    	if (!skip) {
    		rendered = component.render(props, state, context);

    		if (component.getChildContext) {
    			context = extend(extend({}, context), component.getChildContext());
    		}

    		if (isUpdate && component.getSnapshotBeforeUpdate) {
    			snapshot = component.getSnapshotBeforeUpdate(previousProps, previousState);
    		}

    		var childComponent = rendered && rendered.nodeName,
    		    toUnmount,
    		    base;

    		if (typeof childComponent === 'function') {

    			var childProps = getNodeProps(rendered);
    			inst = initialChildComponent;

    			if (inst && inst.constructor === childComponent && childProps.key == inst.__key) {
    				setComponentProps(inst, childProps, 1, context, false);
    			} else {
    				toUnmount = inst;

    				component._component = inst = createComponent(childComponent, childProps, context);
    				inst.nextBase = inst.nextBase || nextBase;
    				inst._parentComponent = component;
    				setComponentProps(inst, childProps, 0, context, false);
    				renderComponent(inst, 1, mountAll, true);
    			}

    			base = inst.base;
    		} else {
    			cbase = initialBase;

    			toUnmount = initialChildComponent;
    			if (toUnmount) {
    				cbase = component._component = null;
    			}

    			if (initialBase || renderMode === 1) {
    				if (cbase) cbase._component = null;
    				base = diff(cbase, rendered, context, mountAll || !isUpdate, initialBase && initialBase.parentNode, true);
    			}
    		}

    		if (initialBase && base !== initialBase && inst !== initialChildComponent) {
    			var baseParent = initialBase.parentNode;
    			if (baseParent && base !== baseParent) {
    				baseParent.replaceChild(base, initialBase);

    				if (!toUnmount) {
    					initialBase._component = null;
    					recollectNodeTree(initialBase, false);
    				}
    			}
    		}

    		if (toUnmount) {
    			unmountComponent(toUnmount);
    		}

    		component.base = base;
    		if (base && !isChild) {
    			var componentRef = component,
    			    t = component;
    			while (t = t._parentComponent) {
    				(componentRef = t).base = base;
    			}
    			base._component = componentRef;
    			base._componentConstructor = componentRef.constructor;
    		}
    	}

    	if (!isUpdate || mountAll) {
    		mounts.push(component);
    	} else if (!skip) {

    		if (component.componentDidUpdate) {
    			component.componentDidUpdate(previousProps, previousState, snapshot);
    		}
    	}

    	while (component._renderCallbacks.length) {
    		component._renderCallbacks.pop().call(component);
    	}if (!diffLevel && !isChild) flushMounts();
    }

    function buildComponentFromVNode(dom, vnode, context, mountAll) {
    	var c = dom && dom._component,
    	    originalComponent = c,
    	    oldDom = dom,
    	    isDirectOwner = c && dom._componentConstructor === vnode.nodeName,
    	    isOwner = isDirectOwner,
    	    props = getNodeProps(vnode);
    	while (c && !isOwner && (c = c._parentComponent)) {
    		isOwner = c.constructor === vnode.nodeName;
    	}

    	if (c && isOwner && (!mountAll || c._component)) {
    		setComponentProps(c, props, 3, context, mountAll);
    		dom = c.base;
    	} else {
    		if (originalComponent && !isDirectOwner) {
    			unmountComponent(originalComponent);
    			dom = oldDom = null;
    		}

    		c = createComponent(vnode.nodeName, props, context);
    		if (dom && !c.nextBase) {
    			c.nextBase = dom;

    			oldDom = null;
    		}
    		setComponentProps(c, props, 1, context, mountAll);
    		dom = c.base;

    		if (oldDom && dom !== oldDom) {
    			oldDom._component = null;
    			recollectNodeTree(oldDom, false);
    		}
    	}

    	return dom;
    }

    function unmountComponent(component) {

    	var base = component.base;

    	component._disable = true;

    	if (component.componentWillUnmount) component.componentWillUnmount();

    	component.base = null;

    	var inner = component._component;
    	if (inner) {
    		unmountComponent(inner);
    	} else if (base) {
    		if (base['__preactattr_'] != null) applyRef(base['__preactattr_'].ref, null);

    		component.nextBase = base;

    		removeNode(base);
    		recyclerComponents.push(component);

    		removeChildren(base);
    	}

    	applyRef(component.__ref, null);
    }

    function Component(props, context) {
    	this._dirty = true;

    	this.context = context;

    	this.props = props;

    	this.state = this.state || {};

    	this._renderCallbacks = [];
    }

    extend(Component.prototype, {
    	setState: function setState(state, callback) {
    		if (!this.prevState) this.prevState = this.state;
    		this.state = extend(extend({}, this.state), typeof state === 'function' ? state(this.state, this.props) : state);
    		if (callback) this._renderCallbacks.push(callback);
    		enqueueRender(this);
    	},
    	forceUpdate: function forceUpdate(callback) {
    		if (callback) this._renderCallbacks.push(callback);
    		renderComponent(this, 2);
    	},
    	render: function render() {}
    });

    function render(vnode, parent, merge) {
      return diff(merge, vnode, {}, false, parent, false);
    }

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var InvalidForm = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    class InvalidFormError extends Error {
    }
    exports.default = InvalidFormError;

    });

    unwrapExports(InvalidForm);

    var CompiledSchema = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });

    function compileSchema(schema) {
        const base = schema.id === undefined ? undefined : new URL(schema.id);
        return compileSchemaWithBase(base, true, schema);
    }
    exports.compileSchema = compileSchema;
    function compileSchemaWithBase(base, isRoot, schema) {
        const root = isRoot ? compileSchemaRoot(base, schema) : undefined;
        let form = { form: "empty" };
        const extra = {};
        if (schema.ref !== undefined) {
            const [refId, refDef] = compileSchemaRef(base, schema.ref);
            form = { form: "ref", refId, refDef };
        }
        if (schema.type !== undefined) {
            if (form.form !== "empty") {
                throw new InvalidForm.default();
            }
            if (schema.type === "null" ||
                schema.type === "boolean" ||
                schema.type === "number" ||
                schema.type === "string") {
                form = { form: "type", type: schema.type };
            }
            else {
                throw new InvalidForm.default();
            }
        }
        if (schema.elements !== undefined) {
            if (form.form !== "empty") {
                throw new InvalidForm.default();
            }
            form = {
                form: "elements",
                schema: compileSchemaWithBase(base, false, schema.elements),
            };
        }
        if (schema.properties !== undefined ||
            schema.optionalProperties !== undefined) {
            if (form.form !== "empty") {
                throw new InvalidForm.default();
            }
            const required = {};
            for (const [name, subSchema] of Object.entries(schema.properties || {})) {
                required[name] = compileSchemaWithBase(base, false, subSchema);
            }
            const optional = {};
            for (const [name, subSchema] of Object.entries(schema.optionalProperties || {})) {
                if (required.hasOwnProperty(name)) {
                    throw new InvalidForm.default();
                }
                optional[name] = compileSchemaWithBase(base, false, subSchema);
            }
            form = {
                form: "properties",
                hasProperties: schema.properties !== undefined,
                required,
                optional,
            };
        }
        if (schema.values !== undefined) {
            if (form.form !== "empty") {
                throw new InvalidForm.default();
            }
            form = {
                form: "values",
                schema: compileSchemaWithBase(base, false, schema.values),
            };
        }
        if (schema.discriminator !== undefined) {
            if (form.form !== "empty") {
                throw new InvalidForm.default();
            }
            const mapping = {};
            for (const [name, subSchema] of Object.entries(schema.discriminator.mapping)) {
                const compiled = compileSchemaWithBase(base, false, subSchema);
                if (compiled.form.form === "properties") {
                    for (const property of Object.keys(compiled.form.required)) {
                        if (property === schema.discriminator.tag) {
                            throw new InvalidForm.default();
                        }
                    }
                    for (const property of Object.keys(compiled.form.optional)) {
                        if (property === schema.discriminator.tag) {
                            throw new InvalidForm.default();
                        }
                    }
                }
                else {
                    throw new InvalidForm.default();
                }
                mapping[name] = compiled;
            }
            form = { form: "discriminator", tag: schema.discriminator.tag, mapping };
        }
        return { root, form, extra };
    }
    function compileSchemaRoot(base, schema) {
        const id = schema.id === undefined ? undefined : new URL(schema.id);
        const definitions = {};
        if (schema.definitions !== undefined) {
            for (const [name, subSchema] of Object.entries(schema.definitions)) {
                definitions[name] = compileSchemaWithBase(base, false, subSchema);
            }
        }
        return { id, definitions };
    }
    function compileSchemaRef(base, ref) {
        if (ref === "" || ref === "#") {
            return [base, undefined];
        }
        else if (ref.startsWith("#")) {
            return [base, ref.substring(1)];
        }
        else {
            const resolvedUrl = new URL(ref, base);
            const fragment = resolvedUrl.hash;
            resolvedUrl.hash = "";
            return [resolvedUrl, fragment === "" ? undefined : fragment.substring(1)];
        }
    }

    });

    unwrapExports(CompiledSchema);
    var CompiledSchema_1 = CompiledSchema.compileSchema;

    var NonRootError_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    class NonRootError extends Error {
    }
    exports.default = NonRootError;

    });

    unwrapExports(NonRootError_1);

    var NoSuchDefinitionError_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    class NoSuchDefinitionError extends Error {
    }
    exports.default = NoSuchDefinitionError;

    });

    unwrapExports(NoSuchDefinitionError_1);

    var Registry_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });


    class Registry {
        constructor() {
            this.registry = {};
            this.missingIds = [];
        }
        register(schema) {
            if (schema.root === undefined) {
                throw new NonRootError_1.default();
            }
            this.registry[this.idToKey(schema.root.id)] = schema;
            const missingIds = [];
            for (const registrySchema of Object.values(this.registry)) {
                this.computeMissingIds(missingIds, registrySchema);
            }
            this.missingIds = missingIds;
            return this.missingIds;
        }
        getMissingIds() {
            return this.missingIds;
        }
        isSealed() {
            return this.missingIds.length === 0;
        }
        get(id) {
            return this.registry[this.idToKey(id)];
        }
        computeMissingIds(out, schema) {
            if (schema.root !== undefined) {
                for (const subSchema of Object.values(schema.root.definitions)) {
                    this.computeMissingIds(out, subSchema);
                }
            }
            switch (schema.form.form) {
                case "ref":
                    if (this.registry.hasOwnProperty(this.idToKey(schema.form.refId))) {
                        const refRoot = this.registry[this.idToKey(schema.form.refId)].root;
                        if (schema.form.refDef !== undefined) {
                            if (!refRoot.definitions.hasOwnProperty(schema.form.refDef)) {
                                throw new NoSuchDefinitionError_1.default(`no definition: ${schema.form.refDef} for schema with id: ${schema.form.refId}`);
                            }
                        }
                    }
                    else {
                        out.push(schema.form.refId);
                    }
                    return;
                case "elements":
                    this.computeMissingIds(out, schema.form.schema);
                    return;
                case "properties":
                    for (const subSchema of Object.values(schema.form.required)) {
                        this.computeMissingIds(out, subSchema);
                    }
                    for (const subSchema of Object.values(schema.form.optional)) {
                        this.computeMissingIds(out, subSchema);
                    }
                    return;
                case "values":
                    this.computeMissingIds(out, schema.form.schema);
                    return;
                case "discriminator":
                    for (const subSchema of Object.values(schema.form.mapping)) {
                        this.computeMissingIds(out, subSchema);
                    }
                    return;
                case "empty":
                    return;
                case "type":
                    return;
            }
        }
        idToKey(id) {
            return id === undefined ? "" : id.toString();
        }
    }
    exports.default = Registry;

    });

    unwrapExports(Registry_1);

    var lib = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    class Ptr {
        static parse(s) {
            if (s === "") {
                return new Ptr([]);
            }
            if (!s.startsWith("/")) {
                throw new InvalidPtrError(s);
            }
            const [, ...tokens] = s.split("/");
            return new Ptr(tokens.map((token) => {
                return token.replace(/~1/g, "/").replace(/~0/g, "~");
            }));
        }
        constructor(tokens) {
            this.tokens = tokens;
        }
        toString() {
            if (this.tokens.length === 0) {
                return "";
            }
            const tokens = this.tokens.map((token) => {
                return token.replace(/~/g, "~0").replace(/\//g, "~1");
            });
            return `/${tokens.join("/")}`;
        }
        eval(instance) {
            for (const token of this.tokens) {
                if (instance.hasOwnProperty(token)) {
                    instance = instance[token];
                }
                else {
                    throw new EvalError(instance, token);
                }
            }
            return instance;
        }
    }
    exports.default = Ptr;
    class InvalidPtrError extends Error {
        constructor(ptr) {
            super(`Invalid JSON Pointer: ${ptr}`);
            this.ptr = ptr;
        }
    }
    exports.InvalidPtrError = InvalidPtrError;
    class EvalError extends Error {
        constructor(instance, token) {
            super(`Error evaluating JSON Pointer: no attribute ${token} on ${instance}`);
            this.instance = instance;
            this.token = token;
        }
    }
    exports.EvalError = EvalError;

    });

    unwrapExports(lib);
    var lib_1 = lib.InvalidPtrError;
    var lib_2 = lib.EvalError;

    var MaxDepthExceededError_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    class MaxDepthExceededError extends Error {
    }
    exports.default = MaxDepthExceededError;

    });

    unwrapExports(MaxDepthExceededError_1);

    var NoSuchSchemaError_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    class NoSuchSchemaError extends Error {
    }
    exports.default = NoSuchSchemaError;

    });

    unwrapExports(NoSuchSchemaError_1);

    var RegistryNotSealedError_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    class RegistryNotSealedError extends Error {
    }
    exports.default = RegistryNotSealedError;

    });

    unwrapExports(RegistryNotSealedError_1);

    var Vm_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });




    class Vm {
        static validate(maxErrors, maxDepth, strictInstanceSemantics, registry, id, instance) {
            if (!registry.isSealed()) {
                throw new RegistryNotSealedError_1.default();
            }
            const schema = registry.get(id);
            if (schema === undefined) {
                throw new NoSuchSchemaError_1.default();
            }
            const vm = new Vm(maxErrors, maxDepth, strictInstanceSemantics, registry, id);
            try {
                vm.eval(schema, instance);
            }
            catch (err) {
                if (!(err instanceof TooManyErrorsError)) {
                    throw err;
                }
            }
            return vm.errors;
        }
        constructor(maxErrors, maxDepth, strictInstanceSemantics, registry, id) {
            this.maxErrors = maxErrors;
            this.maxDepth = maxDepth;
            this.strictInstanceSemantics = strictInstanceSemantics;
            this.registry = registry;
            this.instanceTokens = [];
            this.schemas = [{ id, tokens: [] }];
            this.errors = [];
        }
        eval(schema, instance, parentTag) {
            switch (schema.form.form) {
                case "empty":
                    return;
                case "ref":
                    if (this.schemas.length === this.maxDepth) {
                        throw new MaxDepthExceededError_1.default();
                    }
                    const schemaTokens = schema.form.refDef === undefined
                        ? []
                        : ["definitions", schema.form.refDef];
                    const rootSchema = this.registry.get(schema.form.refId);
                    const refSchema = schema.form.refDef === undefined
                        ? rootSchema
                        : rootSchema.root.definitions[schema.form.refDef];
                    this.schemas.push({ id: schema.form.refId, tokens: schemaTokens });
                    this.eval(refSchema, instance);
                    return;
                case "type":
                    switch (schema.form.type) {
                        case "null":
                            if (instance !== null) {
                                this.pushSchemaToken("type");
                                this.pushError();
                                this.popSchemaToken();
                            }
                            return;
                        case "boolean":
                            if (typeof instance !== "boolean") {
                                this.pushSchemaToken("type");
                                this.pushError();
                                this.popSchemaToken();
                            }
                            return;
                        case "number":
                            if (typeof instance !== "number") {
                                this.pushSchemaToken("type");
                                this.pushError();
                                this.popSchemaToken();
                            }
                            return;
                        case "string":
                            if (typeof instance !== "string") {
                                this.pushSchemaToken("type");
                                this.pushError();
                                this.popSchemaToken();
                            }
                            return;
                    }
                    return;
                case "elements":
                    this.pushSchemaToken("elements");
                    if (Array.isArray(instance)) {
                        for (const [index, subInstance] of instance.entries()) {
                            this.pushInstanceToken(index.toString());
                            this.eval(schema.form.schema, subInstance);
                            this.popInstanceToken();
                        }
                    }
                    else {
                        this.pushError();
                    }
                    this.popSchemaToken();
                    return;
                case "properties":
                    if (typeof instance === "object" &&
                        instance !== null &&
                        !Array.isArray(instance)) {
                        this.pushSchemaToken("properties");
                        for (const [name, subSchema] of Object.entries(schema.form.required)) {
                            if (instance.hasOwnProperty(name)) {
                                this.pushSchemaToken(name);
                                this.pushInstanceToken(name);
                                this.eval(subSchema, instance[name]);
                                this.popInstanceToken();
                                this.popSchemaToken();
                            }
                            else {
                                this.pushSchemaToken(name);
                                this.pushError();
                                this.popSchemaToken();
                            }
                        }
                        this.popSchemaToken();
                        this.pushSchemaToken("optionalProperties");
                        for (const [name, subSchema] of Object.entries(schema.form.optional)) {
                            if (instance.hasOwnProperty(name)) {
                                this.pushSchemaToken(name);
                                this.pushInstanceToken(name);
                                this.eval(subSchema, instance[name]);
                                this.popInstanceToken();
                                this.popSchemaToken();
                            }
                        }
                        this.popSchemaToken();
                        if (this.strictInstanceSemantics) {
                            if (schema.form.hasProperties) {
                                this.pushSchemaToken("properties");
                            }
                            else {
                                this.pushSchemaToken("optionalProperties");
                            }
                            for (const name of Object.keys(instance)) {
                                if (name !== parentTag &&
                                    !schema.form.required.hasOwnProperty(name) &&
                                    !schema.form.optional.hasOwnProperty(name)) {
                                    this.pushInstanceToken(name);
                                    this.pushError();
                                    this.popInstanceToken();
                                }
                            }
                            this.popSchemaToken();
                        }
                    }
                    else {
                        if (schema.form.hasProperties) {
                            this.pushSchemaToken("properties");
                        }
                        else {
                            this.pushSchemaToken("optionalProperties");
                        }
                        this.pushError();
                        this.popSchemaToken();
                    }
                    return;
                case "values":
                    this.pushSchemaToken("values");
                    if (typeof instance === "object" &&
                        instance !== null &&
                        !Array.isArray(instance)) {
                        for (const [name, subInstance] of Object.entries(instance)) {
                            this.pushInstanceToken(name);
                            this.eval(schema.form.schema, subInstance);
                            this.popInstanceToken();
                        }
                    }
                    else {
                        this.pushError();
                    }
                    this.popSchemaToken();
                    return;
                case "discriminator":
                    this.pushSchemaToken("discriminator");
                    if (typeof instance === "object" &&
                        instance !== null &&
                        !Array.isArray(instance)) {
                        if (instance.hasOwnProperty(schema.form.tag)) {
                            const tagValue = instance[schema.form.tag];
                            if (typeof tagValue === "string") {
                                if (schema.form.mapping.hasOwnProperty(tagValue)) {
                                    this.pushSchemaToken("mapping");
                                    this.pushSchemaToken(tagValue);
                                    this.eval(schema.form.mapping[tagValue], instance, schema.form.tag);
                                    this.popSchemaToken();
                                    this.popSchemaToken();
                                }
                                else {
                                    this.pushSchemaToken("mapping");
                                    this.pushInstanceToken(schema.form.tag);
                                    this.pushError();
                                    this.popInstanceToken();
                                    this.popSchemaToken();
                                }
                            }
                            else {
                                this.pushSchemaToken("tag");
                                this.pushInstanceToken(schema.form.tag);
                                this.pushError();
                                this.popInstanceToken();
                                this.popSchemaToken();
                            }
                        }
                        else {
                            this.pushSchemaToken("tag");
                            this.pushError();
                            this.popSchemaToken();
                        }
                    }
                    else {
                        this.pushError();
                    }
                    this.popSchemaToken();
                    return;
            }
        }
        pushSchemaToken(token) {
            this.schemas[this.schemas.length - 1].tokens.push(token);
        }
        popSchemaToken() {
            this.schemas[this.schemas.length - 1].tokens.pop();
        }
        pushInstanceToken(token) {
            this.instanceTokens.push(token);
        }
        popInstanceToken() {
            this.instanceTokens.pop();
        }
        pushError() {
            this.errors.push({
                instancePath: new lib.default([...this.instanceTokens]),
                schemaPath: new lib.default([...this.schemas[this.schemas.length - 1].tokens]),
                schemaId: this.schemas[this.schemas.length - 1].id,
            });
            if (this.errors.length === this.maxErrors) {
                throw new TooManyErrorsError();
            }
        }
    }
    exports.default = Vm;
    class TooManyErrorsError extends Error {
    }

    });

    unwrapExports(Vm_1);

    var Validator_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });

    class Validator {
        constructor(registry, config) {
            this.registry = registry;
            this.config = config || exports.DEFAULT_VALIDATOR_CONFIG;
        }
        validate(instance, schemaId) {
            return Vm_1.default.validate(this.config.maxErrors, this.config.maxDepth, this.config.strictInstanceSemantics, this.registry, schemaId, instance);
        }
    }
    exports.default = Validator;
    exports.DEFAULT_VALIDATOR_CONFIG = {
        maxDepth: 32,
        maxErrors: 0,
        strictInstanceSemantics: false,
    };

    });

    unwrapExports(Validator_1);
    var Validator_2 = Validator_1.DEFAULT_VALIDATOR_CONFIG;

    var lib$1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });

    exports.compileSchema = CompiledSchema.compileSchema;

    exports.Registry = Registry_1.default;

    exports.Validator = Validator_1.default;

    exports.MaxDepthExceededError = MaxDepthExceededError_1.default;

    exports.NonRootError = NonRootError_1.default;

    exports.NoSuchDefinitionError = NoSuchDefinitionError_1.default;

    exports.NoSuchSchemaError = NoSuchSchemaError_1.default;

    exports.RegistryNotSealedError = RegistryNotSealedError_1.default;

    });

    unwrapExports(lib$1);
    var lib_1$1 = lib$1.compileSchema;
    var lib_2$1 = lib$1.Registry;
    var lib_3 = lib$1.Validator;
    var lib_4 = lib$1.MaxDepthExceededError;
    var lib_5 = lib$1.NonRootError;
    var lib_6 = lib$1.NoSuchDefinitionError;
    var lib_7 = lib$1.NoSuchSchemaError;
    var lib_8 = lib$1.RegistryNotSealedError;

    var classnames = createCommonjsModule(function (module) {
    /*!
      Copyright (c) 2017 Jed Watson.
      Licensed under the MIT License (MIT), see
      http://jedwatson.github.io/classnames
    */
    /* global define */

    (function () {

    	var hasOwn = {}.hasOwnProperty;

    	function classNames () {
    		var classes = [];

    		for (var i = 0; i < arguments.length; i++) {
    			var arg = arguments[i];
    			if (!arg) continue;

    			var argType = typeof arg;

    			if (argType === 'string' || argType === 'number') {
    				classes.push(arg);
    			} else if (Array.isArray(arg) && arg.length) {
    				var inner = classNames.apply(null, arg);
    				if (inner) {
    					classes.push(inner);
    				}
    			} else if (argType === 'object') {
    				for (var key in arg) {
    					if (hasOwn.call(arg, key) && arg[key]) {
    						classes.push(key);
    					}
    				}
    			}
    		}

    		return classes.join(' ');
    	}

    	if (module.exports) {
    		classNames.default = classNames;
    		module.exports = classNames;
    	} else {
    		window.classNames = classNames;
    	}
    }());
    });

    var LiveDemo = /** @class */ (function (_super) {
        __extends(LiveDemo, _super);
        function LiveDemo(props) {
            var _this = _super.call(this, props) || this;
            _this.onPresetChange = function (event) {
                var preset = LiveDemo.presets[event.target.value];
                _this.setState({
                    schema: JSON.stringify(preset.schema, null, 2),
                    instance: JSON.stringify(preset.instance, null, 2)
                });
            };
            _this.onSchemaChange = function (event) {
                _this.setState({ schema: event.target.value });
            };
            _this.onInstanceChange = function (event) {
                _this.setState({ instance: event.target.value });
            };
            _this.state = {
                schema: JSON.stringify(LiveDemo.presets[0].schema, null, 2),
                instance: JSON.stringify(LiveDemo.presets[0].instance, null, 2)
            };
            return _this;
        }
        LiveDemo.prototype.render = function () {
            var _a = this.validationState(), badSchemaJSON = _a.badSchemaJSON, badSchemaForm = _a.badSchemaForm, notSealed = _a.notSealed, badInstanceJSON = _a.badInstanceJSON, validationOverflow = _a.validationOverflow, validationErrors = _a.validationErrors;
            var badSchema = badSchemaJSON || badSchemaForm || notSealed;
            var badInstance = badInstanceJSON;
            return (h("div", null,
                h("div", { "class": "row" },
                    h("div", { "class": "col s12 m6 offset-m3" },
                        h("div", { "class": "input-field" },
                            "Preset:",
                            h("select", { className: "browser-default", onChange: this.onPresetChange }, LiveDemo.presets.map(function (preset, index) { return (h("option", { value: index }, preset.name)); }))))),
                h("div", { className: "row" },
                    h("div", { className: "col s12 m6" },
                        h("div", { className: "Home__TryLive__DemoHeader" },
                            h("strong", null, "Schema")),
                        h("textarea", { className: classnames("Home__TryLive__Textarea", { red: badSchema }, { white: !badSchema }), value: this.state.schema, onInput: this.onSchemaChange }),
                        h("div", { className: "Home__TryLive__DemoHeader" },
                            h("strong", null, "Instance")),
                        h("textarea", { className: classnames("Home__TryLive__Textarea", { red: badInstance }, { white: !badInstance }), value: this.state.instance, onInput: this.onInstanceChange })),
                    h("div", { className: "col s12 m6" },
                        h("div", { className: "Home__TryLive__DemoHeader" },
                            h("strong", null, "Errors")),
                        this.renderErrors({
                            badSchemaJSON: badSchemaJSON,
                            badSchemaForm: badSchemaForm,
                            notSealed: notSealed,
                            badInstanceJSON: badInstanceJSON,
                            validationOverflow: validationOverflow,
                            validationErrors: validationErrors
                        })))));
        };
        LiveDemo.prototype.renderErrors = function (state) {
            if (state.badSchemaJSON) {
                return h("div", null, "The inputted schema is not valid JSON.");
            }
            if (state.badSchemaForm) {
                return (h("div", null, "The inputted schema is not a valid JSON Schema Language schema."));
            }
            if (state.notSealed) {
                return (h("div", null,
                    h("div", null,
                        "This live demo does not support the ",
                        h("code", null, "ref"),
                        " keyword. Perhaps you'd like to try a RunKit instead?"),
                    h("div", null,
                        h("a", { href: "https://runkit.com/ucarion/javascript-jsl-demo" }, "RunKit"))));
            }
            if (state.badInstanceJSON) {
                return h("div", null, "The inputted instance is not valid JSON.");
            }
            if (state.validationOverflow) {
                return (h("div", null, "Validation was aborted because of stack overflow. Perhaps your schema has a circular definition?"));
            }
            var errors = state.validationErrors.map(function (err) {
                var instancePath = err.instancePath.tokens.length === 0 ? (h("i", null, "Root of instance")) : (h("code", null, err.instancePath.toString()));
                var schemaPath = h("code", null, err.schemaPath.toString());
                return (h("li", null,
                    "Error at: ",
                    instancePath,
                    " (caused by: ",
                    schemaPath,
                    ")"));
            });
            return (h("div", null,
                h("div", null,
                    "There are ",
                    state.validationErrors.length,
                    " error(s) with the given instance."),
                h("ol", null, errors)));
        };
        LiveDemo.prototype.validationState = function () {
            var parsedSchema, schema, parsedInstance;
            try {
                parsedSchema = JSON.parse(this.state.schema);
            }
            catch (err) {
                return { badSchemaJSON: true };
            }
            try {
                schema = lib_1$1(parsedSchema);
            }
            catch (err) {
                return { badSchemaForm: true };
            }
            var registry = new lib_2$1();
            try {
                registry.register(schema);
            }
            catch (err) {
                return { badSchemaForm: true };
            }
            if (!registry.isSealed()) {
                return { notSealed: true };
            }
            try {
                parsedInstance = JSON.parse(this.state.instance);
            }
            catch (err) {
                return { badInstanceJSON: true };
            }
            try {
                var validator = new lib_3(registry);
                return { validationErrors: validator.validate(parsedInstance) };
            }
            catch (err) {
                return { validationOverflow: true };
            }
        };
        LiveDemo.presets = [
            {
                name: "Example at the top of this page (valid)",
                schema: {
                    properties: {
                        name: { type: "string" },
                        isAdmin: { type: "boolean" },
                        favoriteNumbers: { elements: { type: "number" } }
                    }
                },
                instance: {
                    name: "John Doe",
                    isAdmin: true,
                    favoriteNumbers: [42]
                }
            },
            {
                name: "Example at the top of this page (invalid)",
                schema: {
                    properties: {
                        name: { type: "string" },
                        isAdmin: { type: "boolean" },
                        favoriteNumbers: { elements: { type: "number" } }
                    }
                },
                instance: {
                    isAdmin: "yes",
                    favoriteNumbers: [0, "42", 1337]
                }
            },
            {
                name: "Recursive tree structure (valid)",
                schema: {
                    properties: {
                        value: { type: "string" },
                        children: { elements: { ref: "#" } }
                    }
                },
                instance: {
                    value: "a",
                    children: [
                        { value: "b", children: [] },
                        {
                            value: "c",
                            children: [{ value: "d", children: [{ value: "e", children: [] }] }]
                        },
                        { value: "f", children: [] }
                    ]
                }
            },
            {
                name: "Recursive tree structure (invalid)",
                schema: {
                    properties: {
                        value: { type: "string" },
                        children: { elements: { ref: "#" } }
                    }
                },
                instance: {
                    value: 123,
                    children: [
                        { value: "b", children: [] },
                        {
                            value: "c",
                            children: [{ value: "d", children: [{ value: 123, children: [] }] }]
                        },
                        { value: "f", children: null }
                    ]
                }
            },
            {
                name: "Analytics-like events (valid)",
                schema: {
                    elements: {
                        discriminator: {
                            tag: "event",
                            mapping: {
                                "Page Viewed": {
                                    properties: {
                                        url: { type: "string" }
                                    }
                                },
                                "Order Completed": {
                                    properties: {
                                        productId: { type: "string" },
                                        price: { type: "number" }
                                    }
                                }
                            }
                        }
                    }
                },
                instance: [
                    { event: "Page Viewed", url: "http://example.com" },
                    { event: "Order Completed", productId: "product-123", price: 9.99 }
                ]
            },
            {
                name: "Analytics-like events (invalid)",
                schema: {
                    elements: {
                        discriminator: {
                            tag: "event",
                            mapping: {
                                "Page Viewed": {
                                    properties: {
                                        url: { type: "string" }
                                    }
                                },
                                "Order Completed": {
                                    properties: {
                                        productId: { type: "string" },
                                        price: { type: "number" }
                                    }
                                }
                            }
                        }
                    }
                },
                instance: [
                    { event: "Page Viewed" },
                    { event: "Order Completed", productId: "product-123", price: "9.99" },
                    { event: "Whoops Mispelled Page Viewed" },
                    { whoopsMisspelledEvent: "Page Viewed", url: "http://example.com" }
                ]
            }
        ];
        return LiveDemo;
    }(Component));
    render(h(LiveDemo, null), document.getElementById("Home__TryLive__ReactRoot"));

}());
