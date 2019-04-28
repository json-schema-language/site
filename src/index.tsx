import { Component, h, render } from "preact";
import {
  compileSchema,
  CompiledSchema,
  Registry,
  Validator
} from "@json-schema-language/json-schema-language";
import { ValidationError } from "@json-schema-language/json-schema-language/lib/Validator";
import classNames from "classnames";

interface State {
  schema: string;
  instance: string;
}

class LiveDemo extends Component<{}, State> {
  static presets = [
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

  constructor(props) {
    super(props);

    this.state = {
      schema: JSON.stringify(LiveDemo.presets[0].schema, null, 2),
      instance: JSON.stringify(LiveDemo.presets[0].instance, null, 2)
    };
  }

  onPresetChange = event => {
    const preset = LiveDemo.presets[event.target.value];
    this.setState({
      schema: JSON.stringify(preset.schema, null, 2),
      instance: JSON.stringify(preset.instance, null, 2)
    });
  };

  onSchemaChange = event => {
    this.setState({ schema: event.target.value });
  };

  onInstanceChange = event => {
    this.setState({ instance: event.target.value });
  };

  public render() {
    const {
      badSchemaJSON,
      badSchemaForm,
      notSealed,
      badInstanceJSON,
      validationOverflow,
      validationErrors
    } = this.validationState();

    const badSchema = badSchemaJSON || badSchemaForm || notSealed;
    const badInstance = badInstanceJSON;

    return (
      <div>
        <div class="row">
          <div class="col s12 m6 offset-m3">
            <div class="input-field">
              Preset:
              <select
                className="browser-default"
                onChange={this.onPresetChange}
              >
                {LiveDemo.presets.map((preset, index) => (
                  <option value={index}>{preset.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col s12 m6">
            <div className="Home__TryLive__DemoHeader">
              <strong>Schema</strong>
            </div>

            <textarea
              className={classNames(
                "Home__TryLive__Textarea",
                { red: badSchema },
                { white: !badSchema }
              )}
              value={this.state.schema}
              onInput={this.onSchemaChange}
            />

            <div className="Home__TryLive__DemoHeader">
              <strong>Instance</strong>
            </div>

            <textarea
              className={classNames(
                "Home__TryLive__Textarea",
                { red: badInstance },
                { white: !badInstance }
              )}
              value={this.state.instance}
              onInput={this.onInstanceChange}
            />
          </div>

          <div className="col s12 m6">
            <div className="Home__TryLive__DemoHeader">
              <strong>Errors</strong>
            </div>

            {this.renderErrors({
              badSchemaJSON,
              badSchemaForm,
              notSealed,
              badInstanceJSON,
              validationOverflow,
              validationErrors
            })}
          </div>
        </div>
      </div>
    );
  }

  private renderErrors(state: {
    badSchemaJSON?: boolean;
    badSchemaForm?: boolean;
    notSealed?: boolean;
    badInstanceJSON?: boolean;
    validationOverflow?: boolean;
    validationErrors?: ValidationError[];
  }): JSX.Element {
    if (state.badSchemaJSON) {
      return <div>The inputted schema is not valid JSON.</div>;
    }

    if (state.badSchemaForm) {
      return (
        <div>
          The inputted schema is not a valid JSON Schema Language schema.
        </div>
      );
    }

    if (state.notSealed) {
      return (
        <div>
          <div>
            This live demo does not support the <code>ref</code> keyword.
            Perhaps you'd like to try a RunKit instead?
          </div>
          <div>
            <a href="https://runkit.com/ucarion/javascript-jsl-demo">RunKit</a>
          </div>
        </div>
      );
    }

    if (state.badInstanceJSON) {
      return <div>The inputted instance is not valid JSON.</div>;
    }

    if (state.validationOverflow) {
      return (
        <div>
          Validation was aborted because of stack overflow. Perhaps your schema
          has a circular definition?
        </div>
      );
    }

    const errors = state.validationErrors.map(err => {
      const instancePath =
        err.instancePath.tokens.length === 0 ? (
          <i>Root of instance</i>
        ) : (
          <code>{err.instancePath.toString()}</code>
        );

      const schemaPath = <code>{err.schemaPath.toString()}</code>;

      return (
        <li>
          Error at: {instancePath} (caused by: {schemaPath})
        </li>
      );
    });

    return (
      <div>
        <div>
          There are {state.validationErrors.length} error(s) with the given
          instance.
        </div>

        <ol>{errors}</ol>
      </div>
    );
  }

  private validationState(): {
    badSchemaJSON?: boolean;
    badSchemaForm?: boolean;
    notSealed?: boolean;
    badInstanceJSON?: boolean;
    validationOverflow?: boolean;
    validationErrors?: ValidationError[];
  } {
    let parsedSchema, schema, parsedInstance;

    try {
      parsedSchema = JSON.parse(this.state.schema);
    } catch (err) {
      return { badSchemaJSON: true };
    }

    try {
      schema = compileSchema(parsedSchema);
    } catch (err) {
      return { badSchemaForm: true };
    }

    const registry = new Registry();
    try {
      registry.register(schema);
    } catch (err) {
      return { badSchemaForm: true };
    }

    if (!registry.isSealed()) {
      return { notSealed: true };
    }

    try {
      parsedInstance = JSON.parse(this.state.instance);
    } catch (err) {
      return { badInstanceJSON: true };
    }

    try {
      const validator = new Validator(registry);
      return { validationErrors: validator.validate(parsedInstance) };
    } catch (err) {
      return { validationOverflow: true };
    }
  }
}

render(<LiveDemo />, document.getElementById("Home__TryLive__ReactRoot"));
