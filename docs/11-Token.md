# 11 — Token (JWT)

- `tokens.utils.js` — `generateToken` / `verifyToken` (jsonwebtoken)
- **Access token** (1h) + **Refresh token** (30d)، كل واحد بـ secret مختلف، وكل توكن له `jti` (uuid).
- `SignInService` — يطلّع الاتنين بعد تسجيل الدخول
- `RefreshTokenService` — يطلّع access token جديد من الـ refresh token (header: `refreshtoken`)
- `authenticationMiddleware` — يقرأ header `accesstoken`، يتحقق منه، يتأكد إنه مش في الـ blacklist، ويجيب اليوزر
- `LogoutService` — يحط الـ `jti` في الـ blacklist لحد ما يخلص
- `SignUpServiceGmail` — تسجيل/دخول بـ Google idToken ثم توكنات التطبيق
- `authorizationMiddleware` — صلاحيات حسب الـ role (403 لو مش مسموح)
