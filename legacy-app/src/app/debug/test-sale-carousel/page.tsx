import { ProductCarousel } from "@/components/shared/ProductCarousel";
import { getOnSaleProducts } from "@/firebase/admin/products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TestSaleCarouselPage() {
  const saleProducts = await getOnSaleProducts(10); // Get more to be sure
  const fetchTime = new Date().toISOString();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Test Sale Carousel</h1>

        <div className="mb-8 p-4 bg-gray-100 rounded">
          <p>
            <strong>Data fetched at:</strong> {fetchTime}
          </p>
          <p>
            <strong>Sale products found:</strong> {saleProducts.success ? saleProducts.data.length : 0}
          </p>
          <p>
            <strong>Success:</strong> {saleProducts.success ? "✅ Yes" : "❌ No"}
          </p>
          {!saleProducts.success && (
            <p>
              <strong>Error:</strong> {saleProducts.error}
            </p>
          )}
        </div>

        {saleProducts.success && saleProducts.data.length > 0 ? (
          <ProductCarousel
            products={saleProducts.data}
            title="Special Offers"
            description="Limited-time deals on premium stickers - grab them while they last!"
            viewAllUrl="/products?onSale=true"
            centered={false}
          />
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-4">No Sale Products Found</h2>
            <p className="text-muted-foreground">
              {saleProducts.success ? "There are currently no products on sale." : `Error: ${saleProducts.error}`}
            </p>
          </div>
        )}

        {saleProducts.success && saleProducts.data.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Sale Products Details</h3>
            <div className="space-y-4">
              {saleProducts.data.map(product => (
                <div key={product.id} className="p-4 border rounded">
                  <h4 className="font-semibold">{product.name}</h4>
                  <p>Price: £{product.price}</p>
                  <p>Sale Price: {product.salePrice ? `£${product.salePrice}` : "None"}</p>
                  <p>On Sale: {product.onSale ? "✅ Yes" : "❌ No"}</p>
                  <p>ID: {product.id}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
