import { useEffect } from "react";

/**
 * Sets the document title and meta description for the current page.
 * Resets to default on unmount.
 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} — dispatchCore`;

    let metaDesc = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    const prevDesc = metaDesc?.content;

    if (description) {
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = description;
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.content = prevDesc;
    };
  }, [title, description]);
}
