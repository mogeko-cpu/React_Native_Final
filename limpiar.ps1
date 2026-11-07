# Borra los archivos del intento anterior que ya no se usan (rompen tsc/jest si se quedan).
# Uso: en la carpeta React_Native_Final -> powershell -ExecutionPolicy Bypass -File .\limpiar.ps1
$viejos = @(
  "__tests__\component",
  "__tests__\support\renderScreen.tsx",
  "__tests__\unit\listings\ListingFilter.test.ts",
  "__tests__\unit\sinRoble.test.ts",
  "assets\cars",
  "assets\images\android-icon-background.png",
  "assets\images\android-icon-monochrome.png",
  "smoke.mjs",
  "src\core\components\CarPhoto.tsx",
  "src\core\data\FakeFileStorage.ts",
  "src\core\poller.ts",
  "src\features\auth\domain\entities\AppUser.ts",
  "src\features\auth\presentation\screens\ProfileScreen.tsx",
  "src\features\groups\domain\models",
  "src\features\groups\presentation\screens\ChatsScreen.tsx",
  "src\features\groups\presentation\viewmodels\useChatsViewModel.ts",
  "src\features\listings\domain\entities\ListingFilter.ts",
  "src\features\listings\presentation\context\FollowsContext.tsx",
  "src\features\listings\presentation\screens\CatalogScreen.tsx",
  "src\features\listings\presentation\screens\MentorshipScreen.tsx",
  "src\features\listings\presentation\viewmodels\useCatalogViewModel.ts",
  "src\features\listings\presentation\viewmodels\useMentorshipViewModel.ts",
  "src\features\notifications\presentation\context\NotificationsContext.tsx",
  "src\features\profiles",
  "src\features\users\domain\entities\UserProfile.ts",
  "src\features\users\presentation\viewmodels\useUser.ts",
  "src\features\users\presentation\viewmodels\useUserRepository.ts",
  "src\theme\dark-colors.json",
  "src\theme\light-colors.json"
)
foreach ($p in $viejos) {
  if (Test-Path $p) { Remove-Item -Recurse -Force $p; Write-Host "Borrado: $p" }
}
Write-Host "Listo. Ahora: Remove-Item -Recurse -Force node_modules; npm install"
