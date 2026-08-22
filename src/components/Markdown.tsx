import type { JSX, ReactNode } from 'react';

/**
 * Рендерер того подмножества Markdown, на котором написаны соглашение и политика:
 * заголовки, абзацы, списки, таблицы, разделители, а внутри строки — жирный текст,
 * курсив, моноширинный код и ссылки. Полноценный парсер сюда тащить незачем —
 * документы пишем мы сами и знаем их разметку.
 */

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;

function inline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).filter((part) => part !== '').map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      return (
        <a href={link[2]} key={key} rel="noreferrer noopener" target="_blank">{link[1]}</a>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

function cells(row: string): string[] {
  return row.replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
}

export function Markdown({ source }: { source: string }): JSX.Element {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (line === '') {
      index += 1;
      continue;
    }

    if (line.startsWith('#')) {
      const level = line.length - line.replace(/^#+/, '').length;
      const text = line.slice(level).trim();
      // Заголовок страницы — h1, поэтому документ начинается с h2 и уходит вглубь.
      const Heading = (level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4') as 'h2' | 'h3' | 'h4';
      blocks.push(<Heading key={`h-${index}`}>{inline(text, `h-${index}`)}</Heading>);
      index += 1;
      continue;
    }

    if (/^-{3,}$/.test(line)) {
      blocks.push(<hr key={`hr-${index}`} />);
      index += 1;
      continue;
    }

    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('- ')) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push(
        <ul key={`ul-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`li-${index}-${itemIndex}`}>{inline(item, `li-${index}-${itemIndex}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        const row = lines[index].trim();
        // Строка вида |---|---| только разделяет шапку и тело.
        if (!/^\|[\s:|-]+\|$/.test(row)) rows.push(cells(row));
        index += 1;
      }
      const [head, ...body] = rows;
      blocks.push(
        <div className="markdown__table" key={`table-${index}`}>
          <table>
            <thead>
              <tr>{head.map((cell, cellIndex) => <th key={`th-${index}-${cellIndex}`}>{inline(cell, `th-${index}-${cellIndex}`)}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={`tr-${index}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`td-${index}-${rowIndex}-${cellIndex}`}>{inline(cell, `td-${index}-${rowIndex}-${cellIndex}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() !== '' && !/^[-#|]/.test(lines[index].trim())) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    const text = paragraph.join(' ');
    blocks.push(<p key={`p-${index}`}>{inline(text, `p-${index}`)}</p>);
  }

  return <div className="markdown">{blocks}</div>;
}
