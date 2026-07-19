/**
 * Tagged template literal for HTML strings.
 * At runtime, this just concatenates the template - no processing.
 * At build time (production), the esbuild plugin minifies the HTML.
 *
 * Usage:
 * ```ts
 * import { html } from '../utils/html';
 *
 * const myHtml = html`
 *   <div class="container">
 *     <span>${someValue}</span>
 *   </div>
 * `;
 * ```
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  // At runtime, just concatenate the template parts with values
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += String(values[i]) + strings[i + 1];
  }
  return result;
}

export default html;
