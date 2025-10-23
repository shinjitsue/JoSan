import { PRIVATE_SELECTORS } from "../config/SelectorConfig";

export class PrivacyFilter {
  static isPrivateContent(node: Node): boolean {
    if (!(node instanceof Element)) return false;

    return PRIVATE_SELECTORS.some((selector) => {
      try {
        return node.matches(selector) || node.closest(selector) !== null;
      } catch {
        return false;
      }
    });
  }
}
