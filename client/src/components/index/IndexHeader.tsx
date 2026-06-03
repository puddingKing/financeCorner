interface IndexHeaderProps {
  name: string;
  date: string;
}

export function IndexHeader({ name, date }: IndexHeaderProps) {
  return (
    <header className="header">
      <h1>{name}</h1>
      <p className="subtitle">{date} 分时走势（上一交易日）</p>
    </header>
  );
}
