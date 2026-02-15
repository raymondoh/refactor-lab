import { ProductCarousel } from "@/components/shared/ProductCarousel";
import { adminProductService } from "@/lib/services/admin-product-service";
import { serializeProductArray } from "@/utils/serializeProduct";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TestSaleCarouselPage() {
  const saleProducts = await adminProductService.getOnSaleProducts(10);
  const fetchTime = new Date().toISOString();

  // Step A: Create a safe array and serialize it to fix the type mismatch (SerializedProduct[] vs Product[])
  const saleItems = saleProducts.ok && saleProducts.data ? serializeProductArray(saleProducts.data) : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Test Sale Carousel</h1>

        <div className="mb-8 p-4 bg-gray-100 rounded">
          <p>
            <strong>Data fetched at:</strong> {fetchTime}
          </p>
          <p>
            {/* Replace saleProducts.data.length with saleItems.length */}
            <strong>Sale products found:</strong> {saleItems.length}
          </p>
          <p>
            <strong>Success:</strong> {saleProducts.ok ? "✅ Yes" : "❌ No"}
          </p>
          {!saleProducts.ok && (
            <p className="text-red-600">
              <strong>Error:</strong> {saleProducts.error}
            </p>
          )}
        </div>

        {/* Use saleItems.length for the conditional check */}
        {saleItems.length > 0 ? (
          <ProductCarousel
            products={saleItems}
            title="Special Offers"
            description="Limited-time deals on premium stickers - grab them while they last!"
            viewAllUrl="/products?onSale=true"
            centered={false}
          />
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-4">No Sale Products Found</h2>
            <p className="text-muted-foreground">
              {saleProducts.ok ? "There are currently no products on sale." : `Error: ${saleProducts.error}`}
            </p>
          </div>
        )}

        {saleItems.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Sale Products Details</h3>
            <div className="space-y-4">
              {/* Use saleItems.map instead of saleProducts.data.map */}
              {saleItems.map(product => (
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
