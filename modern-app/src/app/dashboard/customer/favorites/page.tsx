import FavoritesContent from "./FavoritesContent";
import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";

export default async function FavoritesPage() {
  const session = await requireSession();

  const favorites = await userService.getFavoriteTradespeople(session.user.id);

  return <FavoritesContent initialFavorites={favorites} />;
}
