import { ProductCard } from "../ProductCard";

export default function ProductCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <ProductCard
        id="1"
        title="Marketing Email Template"
        type="Email"
        createdAt={new Date(Date.now() - 2 * 60 * 60 * 1000)}
        onEdit={() => console.log("Edit clicked")}
        onDownload={() => console.log("Download clicked")}
        onDelete={() => console.log("Delete clicked")}
      />
    </div>
  );
}
