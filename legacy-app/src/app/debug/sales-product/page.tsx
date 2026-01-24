import { getOnSaleProducts, getAllProducts } from "@/firebase/admin/products";

export default async function SaleProductsDebugPage() {
  // Test both functions
  const saleProducts = await getOnSaleProducts(10);
  const allProducts = await getAllProducts({ limit: 5 });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sale Products Debug</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sale Products Results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">getOnSaleProducts() Results</h2>
          <div className="space-y-2">
            <p>
              <strong>Success:</strong> {saleProducts.success ? "✅ Yes" : "❌ No"}
            </p>
            <p>
              <strong>Count:</strong> {saleProducts.success ? saleProducts.data.length : 0}
            </p>
            {!saleProducts.success && (
              <p className="text-red-600">
                <strong>Error:</strong> {saleProducts.error}
              </p>
            )}
          </div>

          {saleProducts.success && saleProducts.data.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Sale Products:</h3>
              <div className="space-y-2 text-sm">
                {saleProducts.data.map(product => (
                  <div key={product.id} className="p-2 bg-gray-50 rounded">
                    <p>
                      <strong>Name:</strong> {product.name}
                    </p>
                    <p>
                      <strong>Price:</strong> £{product.price}
                    </p>
                    <p>
                      <strong>Sale Price:</strong> {product.salePrice ? `£${product.salePrice}` : "None"}
                    </p>
                    <p>
                      <strong>On Sale:</strong> {product.onSale ? "✅ Yes" : "❌ No"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* All Products Sample */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Sample Products (for comparison)</h2>
          <div className="space-y-2">
            <p>
              <strong>Success:</strong> {allProducts.success ? "✅ Yes" : "❌ No"}
            </p>
            <p>
              <strong>Count:</strong> {allProducts.success ? allProducts.data.length : 0}
            </p>
          </div>

          {allProducts.success && allProducts.data.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Sample Products:</h3>
              <div className="space-y-2 text-sm">
                {allProducts.data.slice(0, 3).map(product => (
                  <div key={product.id} className="p-2 bg-gray-50 rounded">
                    <p>
                      <strong>Name:</strong> {product.name}
                    </p>
                    <p>
                      <strong>Price:</strong> £{product.price}
                    </p>
                    <p>
                      <strong>Sale Price:</strong> {product.salePrice ? `£${product.salePrice}` : "None"}
                    </p>
                    <p>
                      <strong>On Sale:</strong> {product.onSale ? "✅ Yes" : "❌ No"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Quick Checks</h2>
        <div className="space-y-2 text-sm">
          <p>
            1. ✅ Check that your products have <code>onSale: true</code> in the database
          </p>
          <p>2. ✅ Verify the field name is exactly "onSale" (case-sensitive)</p>
          <p>3. ✅ Make sure you have at least 3 products with onSale: true</p>
          <p>4. ✅ Check the server console for any Firebase errors</p>
        </div>
      </div>
    </div>
  );
}
