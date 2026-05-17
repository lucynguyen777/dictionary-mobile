declare module 'mammoth' {
  export interface ConvertToHtmlOptions {
    includeDefaultStyleMap?: boolean;
    includeEmbeddedStyleMap?: boolean;
  }

  export interface ConvertToHtmlResult {
    value: string;
    messages: any[];
  }

  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer },
    options?: ConvertToHtmlOptions
  ): Promise<ConvertToHtmlResult>;
}
