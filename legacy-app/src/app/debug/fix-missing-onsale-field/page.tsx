import { fixMissingOnSaleField } from "@/lib/services/product-services";

export default async function FixMissingOnSaleFieldPage() {
  const result = await fixMissingOnSaleField();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Fix Missing onSale Field</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Auto-Fix Results</h2>

        {result.success ? (
          <div className="text-green-600">
            <p className="text-lg">✅ Success!</p>
            <p>{result.message}</p>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Total products:</strong> {result.total}
              </p>
              <p>
                <strong>Fixed:</strong> {result.fixed}
              </p>
              <p>
                <strong>Already had field:</strong> {result.alreadyHadField}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-red-600">
            <p className="text-lg">❌ Error</p>
            <p>{result.error}</p>
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">What This Does</h2>
        <div className="space-y-2 text-sm">
          <p>1. ✅ Scans all products in the database</p>
          <p>
            2. ✅ Finds products missing the <code>onSale</code> field
          </p>
          <p>
            3. ✅ Sets <code>onSale: false</code> for those products
          </p>
          <p>
            4. ✅ Leaves existing <code>onSale</code> values unchanged
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> Refresh this page to run the script again, or check your Firebase console to see the
          updates.
        </p>
      </div>
    </div>
  );
}
