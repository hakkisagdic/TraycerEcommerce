import React from "react";

type TipTapMark = {
  type: string;
  attrs?: Record<string, any>;
};

type TipTapNode = {
  type: string;
  attrs?: Record<string, any>;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  text?: string;
};

function parseContentJson(raw: unknown): TipTapNode | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw as TipTapNode;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") return parsed as TipTapNode;
      return null;
    } catch {
      return null;
    }
  }
  return null;
}

function renderMarks(text: string, marks: TipTapMark[] | undefined, key: string) {
  let element: React.ReactNode = text;
  if (!marks || marks.length === 0) {
    return <React.Fragment key={key}>{element}</React.Fragment>;
  }
  marks.forEach((mark, i) => {
    const markKey = `${key}-m${i}`;
    switch (mark.type) {
      case "bold":
        element = <strong key={markKey}>{element}</strong>;
        break;
      case "italic":
        element = <em key={markKey}>{element}</em>;
        break;
      case "strike":
        element = <s key={markKey}>{element}</s>;
        break;
      case "code":
        element = <code key={markKey}>{element}</code>;
        break;
      case "underline":
        element = <u key={markKey}>{element}</u>;
        break;
      case "link": {
        const href = (mark.attrs?.href as string | undefined) ?? "#";
        const target = (mark.attrs?.target as string | undefined) ?? undefined;
        const rel = target === "_blank" ? "noopener noreferrer" : undefined;
        element = (
          <a key={markKey} href={href} target={target} rel={rel}>
            {element}
          </a>
        );
        break;
      }
      default:
        break;
    }
  });
  return <React.Fragment key={key}>{element}</React.Fragment>;
}

function renderNodes(nodes: TipTapNode[] | undefined, keyPrefix: string): React.ReactNode[] {
  if (!nodes || nodes.length === 0) return [];
  return nodes.map((node, i) => renderNode(node, `${keyPrefix}-${i}`));
}

function renderNode(node: TipTapNode, key: string): React.ReactNode {
  if (!node || !node.type) return null;
  switch (node.type) {
    case "doc":
      return (
        <React.Fragment key={key}>
          {renderNodes(node.content, key)}
        </React.Fragment>
      );
    case "paragraph":
      return <p key={key}>{renderNodes(node.content, key)}</p>;
    case "heading": {
      const level = Math.min(Math.max(Number(node.attrs?.level ?? 1), 1), 6);
      const Tag = (`h${level}` as unknown) as keyof JSX.IntrinsicElements;
      return <Tag key={key}>{renderNodes(node.content, key)}</Tag>;
    }
    case "bulletList":
      return <ul key={key}>{renderNodes(node.content, key)}</ul>;
    case "orderedList":
      return (
        <ol key={key} start={node.attrs?.start ?? undefined}>
          {renderNodes(node.content, key)}
        </ol>
      );
    case "listItem":
      return <li key={key}>{renderNodes(node.content, key)}</li>;
    case "blockquote":
      return <blockquote key={key}>{renderNodes(node.content, key)}</blockquote>;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{renderNodes(node.content, key)}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={key} />;
    case "hardBreak":
      return <br key={key} />;
    case "image": {
      const src = (node.attrs?.src as string | undefined) ?? "";
      const alt = (node.attrs?.alt as string | undefined) ?? "";
      const title = (node.attrs?.title as string | undefined) ?? undefined;
      if (!src) return null;
      // eslint-disable-next-line @next/next/no-img-element
      return <img key={key} src={src} alt={alt} title={title} />;
    }
    case "text":
      return renderMarks(node.text ?? "", node.marks, key);
    default:
      return (
        <React.Fragment key={key}>
          {renderNodes(node.content, key)}
        </React.Fragment>
      );
  }
}

function renderFallbackText(text: string) {
  const paragraphs = (text || "").split(/\n\n+/).filter(Boolean);
  return paragraphs.map((p, i) => <p key={`fb-${i}`}>{p}</p>);
}

export default function PostContent({ post }: { post: any }) {
  const doc = parseContentJson(post?.contentJson);

  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold mt-2">{post.title}</h1>
      <div className="text-sm text-zinc-400 mb-4">
        {post.author?.name} •{" "}
        {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
      </div>
      {doc ? renderNode(doc, "root") : renderFallbackText(post?.contentText ?? "")}
    </article>
  );
}
