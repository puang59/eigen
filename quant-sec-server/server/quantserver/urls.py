from django.urls import path
import quantserver.views as vi

urlpatterns = [
    # Original CLI endpoints
    path("get-public-key/", vi.getUserPublicKey),
    path("post-email/", vi.postEmail),
    path("register-user/", vi.registerUser),
    path("check-uniqueness/", vi.checkForUniqueness),
    path("get-inbox/", vi.returnInbox),
    path("clear-inbox/", vi.clearInbox),
    
    # New Web API endpoints
    path("api/keygen/", vi.kyberKeygen),
    path("api/encrypt/", vi.kyberEncrypt),
    path("api/decrypt/", vi.kyberDecrypt),
    path("api/login/", vi.webLogin),
    path("api/register/", vi.webRegister),
    path("api/kyber-params/", vi.getKyberParams),
]
