import { LanguageMenu } from 'suetavpn';

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  minHeight: 180,
  alignContent: 'start',
  flexWrap: 'wrap',
};

/** Переключатель языка в шапке: флаг, код и раскрывающийся список. */
export const Header = () => (
  <div style={row}>
    <LanguageMenu />
  </div>
);

/** Тот же переключатель в выдвижном меню — растягивается на ширину. */
export const InDrawer = () => (
  <div style={{ ...row, maxWidth: 280 }}>
    <LanguageMenu drawer />
  </div>
);
