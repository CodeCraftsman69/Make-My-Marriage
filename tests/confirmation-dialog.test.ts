import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

type Element = { type: string; props: Record<string, unknown> & { children?: unknown } };
function elements(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Element;
  return [node, ...elements(node.props.children)];
}

// Exercise the actual component's event/lifecycle contract without a browser dependency.
// Native focus trapping and responsive appearance still require browser verification.
function render(overrides: Record<string, unknown> = {}) {
  class FocusElement { isConnected = true; focused = false; focus() { this.focused = true; } }
  const previousFocus = new FocusElement();
  const cancelButton = new FocusElement();
  const modal = { opened: false, showModal() { this.opened = true; }, close() { this.opened = false; }, getBoundingClientRect: () => ({ left: 10, right: 100, top: 10, bottom: 100 }) };
  const document = { activeElement: previousFocus, body: { style: { overflow: "auto" } } };
  const refs = [modal, cancelButton];
  let effect: (() => (() => void) | undefined) | undefined;
  let failure = "";
  const jsx = (type: string, props: Element["props"]): Element => ({ type, props });
  const dependencies: Record<string, unknown> = {
    react: { useRef: (initial: unknown) => ({ current: refs.length ? refs.shift() : initial }), useEffect: (fn: typeof effect) => { effect = fn; }, useId: () => "confirmation-test", useState: () => [failure, (value: string) => { failure = value; }] },
    "react/jsx-runtime": { jsx, jsxs: jsx },
  };
  const compiled = ts.transpileModule(readFileSync(new URL("../src/shared/ui/confirmation-dialog.tsx", import.meta.url), "utf8"), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", "document", "HTMLElement", compiled)((name: string) => dependencies[name], compiledModule, compiledModule.exports, document, FocusElement);
  const { ConfirmationDialog } = compiledModule.exports as { ConfirmationDialog: (props: Record<string, unknown>) => Element };
  let confirmed = 0, cancelled = 0;
  const tree = ConfirmationDialog({ open: true, title: "Cancel invitation?", description: "This link will stop working.", confirmLabel: "Cancel invitation", onConfirm: async () => { confirmed++; }, onCancel: () => { cancelled++; }, ...overrides });
  const dialog = elements(tree).find(node => node.type === "dialog")!;
  const form = elements(tree).find(node => node.type === "form")!;
  return { tree, dialog, form, modal, document, previousFocus, cancelButton, effect: () => effect?.(), counts: () => ({ confirmed, cancelled }), failure: () => failure };
}

test("confirmation dialog opens modally, focuses cancel, locks scroll, and restores focus", () => {
  const view = render();
  const cleanup = view.effect();
  assert.equal(view.modal.opened, true);
  assert.equal(view.cancelButton.focused, true);
  assert.equal(view.document.body.style.overflow, "hidden");
  assert.equal(view.dialog.props["aria-labelledby"], "confirmation-test-title");
  assert.equal(view.dialog.props["aria-describedby"], "confirmation-test-description");
  cleanup?.();
  assert.equal(view.modal.opened, false);
  assert.equal(view.document.body.style.overflow, "auto");
  assert.equal(view.previousFocus.focused, true);
  assert.equal(render({ open: false }).effect(), undefined);
});
test("Escape and backdrop cancel only while idle; clicks inside do not dismiss", () => {
  const view = render(); let prevented = false;
  (view.dialog.props.onCancel as (event: { preventDefault: () => void }) => void)({ preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true); assert.equal(view.counts().cancelled, 1);
  const click = view.dialog.props.onClick as (event: unknown) => void;
  click({ target: view.modal, currentTarget: view.modal, clientX: 20, clientY: 20 });
  assert.equal(view.counts().cancelled, 1);
  click({ target: view.modal, currentTarget: view.modal, clientX: 0, clientY: 0 });
  assert.equal(view.counts().cancelled, 2);
  const busy = render({ busy: true });
  (busy.dialog.props.onCancel as (event: unknown) => void)({ preventDefault() {} });
  (busy.dialog.props.onClick as (event: unknown) => void)({ target: busy.modal, currentTarget: busy.modal, clientX: 0, clientY: 0 });
  assert.equal(busy.counts().cancelled, 0);
  assert.ok(elements(busy.tree).filter(node => node.type === "button").every(node => node.props.disabled));
});
test("rapid confirm clicks submit once and prevent dismissal during the request", async () => {
  let release!: () => void, calls = 0;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const view = render({ onConfirm: async () => { calls++; await pending; } });
  const submit = view.form.props.onSubmit as (event: { preventDefault: () => void }) => Promise<void>;
  const first = submit({ preventDefault() {} });
  const second = submit({ preventDefault() {} });
  (view.dialog.props.onCancel as (event: unknown) => void)({ preventDefault() {} });
  assert.equal(calls, 1); assert.equal(view.counts().cancelled, 0);
  release(); await Promise.all([first, second]);
});
test("dialog exposes action errors and safely handles unexpected callback failures", async () => {
  const withError = render({ error: "Please wait before resending." });
  assert.ok(elements(withError.tree).some(node => node.props.role === "alert" && node.props.children === "Please wait before resending."));
  const failed = render({ onConfirm: async () => { throw new Error("private-internal-details"); } });
  await (failed.form.props.onSubmit as (event: unknown) => Promise<void>)({ preventDefault() {} });
  assert.match(failed.failure(), /Please try again/);
  assert.doesNotMatch(failed.failure(), /private-internal/);
});
