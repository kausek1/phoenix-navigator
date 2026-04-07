const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="animate-fade-in">
    <h1 className="text-2xl font-bold text-foreground mb-1">{title}</h1>
    <p className="text-muted-foreground text-sm">This page is under construction.</p>
  </div>
);

export default PlaceholderPage;
