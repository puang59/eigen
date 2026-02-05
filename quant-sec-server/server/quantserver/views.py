from rest_framework.response import Response
from rest_framework.decorators import api_view
from .serializer import UserSerializer, EmailSerializer
from .models import Users, Emails
from .utils import verifyUser
import datetime
import os
import sys
import base64
import hashlib
import json

# Add path to client crypto module
CLIENT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'quant-sec-client'))
sys.path.insert(0, CLIENT_PATH)
from crypto.crystal.kyber import Kyber512
import crypto.aes as aes


@api_view(["GET"])
def getUserPublicKey(request):
    username = request.GET.get("username")

    if username == None:
        return Response({"Message": "Invalid request", "Status": "Negative"})
    user = Users.objects.filter(username=username).all()
    if len(user) < 1:
        return Response({"Message": "The user doesn't exist", "Status": "Negative"})

    serializer = UserSerializer(user[0]).data
    return Response(
        {
            "Message": "Request succesfully executed",
            "Status": "Positive",
            "Name": serializer["name"],
            "Public Key": serializer["public_key"],
        }
    )


@api_view(["POST"])
def postEmail(request):
    reciever_username = ""
    sender_username = ""
    aes_encrypted_subject = ""
    aes_encrypted_body = ""
    sender_password = ""

    try:
        reciever_username = request.data["reciever_username"]
        sender_username = request.data["sender_username"]
        aes_encrypted_subject = request.data["subject"]
        aes_encrypted_body = request.data["body"]
        sender_password = request.data["password"]
    except:
        return Response({"Message": "Invalid request", "Status": "Negative"})

    current_datetime = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        sender = Users.objects.get(username=sender_username)
        if not verifyUser(sender, sender_password):
            return Response({"Message": "Request denied", "Status": "Negative"})
        reciever = Users.objects.get(username=reciever_username)
    except:
        return Response(
            {
                "Message": "Email parties don't belong the pool of registered users",
                "Status": "Negative",
            }
        )

    Emails.objects.create(
        sender=sender,
        reciever=reciever,
        datetime_of_arrival=current_datetime,
        encrypted_subject=aes_encrypted_subject,
        encrypted_body=aes_encrypted_body,
    )

    return Response({"Message": "Email sent succesfully", "Status": "Positive"})


@api_view(["GET"])
def checkForUniqueness(request):
    username = request.GET.get("username")

    if username == None:
        return Response({"Message": "Invalid request", "Status": "Negative"})
    user = Users.objects.filter(username=username).all()
    if len(user) < 1:
        return Response({"Message": "The user doesn't exist", "Status": "Positive"})
    else:
        return Response(
            {"Message": "A user exists with this username", "Status": "Negative"}
        )


@api_view(["POST"])
def registerUser(request):
    name = ""
    username = ""
    public_key = ""
    password = ""

    try:
        name = request.data["name"]
        username = request.data["username"]
        public_key = request.data["public_key"]
        password = request.data["password"]
    except:
        return Response({"Message": "Invalid Request", "Status": "Negative"})
    random_salt = str(base64.b64encode(os.urandom(20)), encoding="utf-8")
    hashed_password = hashlib.sha256(
        str(password + random_salt).encode("utf-8")
    ).hexdigest()

    user = Users(
        name=name,
        username=username,
        public_key=public_key,
        salt=random_salt,
        hashed_password=hashed_password,
    )

    try:
        user.save()
    except:
        return Response({"Message": "Some error occured", "Status": "Negative"})

    return Response({"Message": "User registered", "Status": "Positive"})


@api_view(["GET"])
def returnInbox(request):
    username = request.GET.get("username")
    password = request.GET.get("password")

    if username == None or password == None:
        return Response({"Message": "Invalid Request", "Status": "Negative"})

    user = Users.objects.get(username=username)
    if not verifyUser(user, password):
        return Response({"Message": "Request denied", "Status": "Negative"})

    emails = user.recieved.filter(synced=False)
    print(emails)
    serializer = EmailSerializer(emails, many=True).data
    for email in emails:
        email.synced = True
        email.save()

    return Response(
        {"Message": "Request completed", "Status": "Positive", "Emails": serializer}
    )


@api_view(["POST"])
def clearInbox(request):
    username = request.data.get("username")
    password = request.data.get("password")
    if username == None or password == None:
        return Response({"Message": "Invalid Request", "Status": "Negative"})

    user = Users.objects.get(username=username)
    if not verifyUser(user, password):
        return Response({"Message": "Request denied", "Status": "Negative"})

    user.recieved.all().delete()

    return Response({"Message": "Deletion succesfull", "Status": "Positive"})


# ========== NEW WEB API ENDPOINTS ==========

@api_view(["POST"])
def kyberKeygen(request):
    """Generate a Kyber512 keypair for web registration"""
    try:
        public_key, private_key = Kyber512.keygen()
        return Response({
            "Status": "Positive",
            "Message": "Keypair generated successfully",
            "public_key": str(base64.b64encode(public_key), encoding="utf-8"),
            "private_key": str(base64.b64encode(private_key), encoding="utf-8"),
        })
    except Exception as e:
        return Response({
            "Status": "Negative",
            "Message": f"Error generating keypair: {str(e)}"
        })


@api_view(["POST"])
def kyberEncrypt(request):
    """Encrypt a message using Kyber512 + AES hybrid encryption"""
    try:
        message = request.data.get("message")
        receiver_public_key = request.data.get("receiver_public_key")
        
        if not message or not receiver_public_key:
            return Response({
                "Status": "Negative",
                "Message": "Missing message or receiver_public_key"
            })
        
        # Decode public key
        pk_bytes = base64.b64decode(receiver_public_key)
        
        # Generate shared secret using Kyber encapsulation
        encrypted_shared_key, shared_key = Kyber512.enc(pk_bytes)
        
        # Use shared key for AES encryption
        shared_key_b64 = str(base64.b64encode(shared_key), encoding="utf-8")
        encrypted_data = aes.encrypt(message, shared_key_b64)
        
        # Build encrypted package
        encrypted_package = json.dumps({
            "salt": encrypted_data["salt"],
            "cipher_text": encrypted_data["cipher_text"],
            "encrypted_passkey": str(base64.b64encode(encrypted_shared_key), encoding="utf-8"),
        })
        
        # Generate integrity tag
        tag = hashlib.sha256(encrypted_package.encode()).hexdigest()
        
        return Response({
            "Status": "Positive",
            "Message": "Encryption successful",
            "tag": tag,
            "encrypted_data": encrypted_package,
            # Return intermediate values for visualization
            "visualization": {
                "original_message_length": len(message),
                "shared_key_preview": shared_key_b64[:16] + "...",
                "encrypted_key_length": len(encrypted_shared_key),
                "cipher_text_length": len(encrypted_data["cipher_text"]),
            }
        })
    except Exception as e:
        return Response({
            "Status": "Negative",
            "Message": f"Encryption error: {str(e)}"
        })


@api_view(["POST"])
def kyberDecrypt(request):
    """Decrypt a message using Kyber512 + AES hybrid decryption"""
    try:
        tag = request.data.get("tag")
        encrypted_data = request.data.get("encrypted_data")
        private_key = request.data.get("private_key")
        
        if not tag or not encrypted_data or not private_key:
            return Response({
                "Status": "Negative",
                "Message": "Missing tag, encrypted_data, or private_key"
            })
        
        # Verify integrity tag
        gen_tag = hashlib.sha256(encrypted_data.encode()).hexdigest()
        if tag != gen_tag:
            return Response({
                "Status": "Negative",
                "Message": "Integrity check failed - data may be tampered"
            })
        
        # Parse encrypted data
        enc_data = json.loads(encrypted_data)
        cipher_text = enc_data["cipher_text"]
        encrypted_passkey = enc_data["encrypted_passkey"]
        salt = enc_data["salt"]
        
        # Decode private key and decrypt the shared key
        sk_bytes = base64.b64decode(private_key)
        passkey = Kyber512.dec(base64.b64decode(encrypted_passkey), sk_bytes)
        
        # Decrypt the message using AES
        passkey_b64 = str(base64.b64encode(passkey), encoding="utf-8")
        decrypted_message = aes.decrypt(
            {"salt": salt, "cipher_text": cipher_text},
            passkey_b64
        )
        
        return Response({
            "Status": "Positive",
            "Message": "Decryption successful",
            "decrypted_message": str(decrypted_message, encoding="utf-8"),
            # Return intermediate values for visualization
            "visualization": {
                "decrypted_key_preview": passkey_b64[:16] + "...",
                "decrypted_message_length": len(decrypted_message),
            }
        })
    except Exception as e:
        return Response({
            "Status": "Negative",
            "Message": f"Decryption error: {str(e)}"
        })


@api_view(["POST"])
def webLogin(request):
    """Login endpoint for web interface"""
    try:
        username = request.data.get("username")
        password = request.data.get("password")
        
        if not username or not password:
            return Response({
                "Status": "Negative",
                "Message": "Missing username or password"
            })
        
        try:
            user = Users.objects.get(username=username)
        except Users.DoesNotExist:
            return Response({
                "Status": "Negative",
                "Message": "User not found"
            })
        
        if not verifyUser(user, password):
            return Response({
                "Status": "Negative",
                "Message": "Invalid password"
            })
        
        serializer = UserSerializer(user).data
        
        return Response({
            "Status": "Positive",
            "Message": "Login successful",
            "user": {
                "username": serializer["username"],
                "name": serializer["name"],
                "public_key": serializer["public_key"],
                "private_key": user.private_key,  # Return private key for web client
            }
        })
    except Exception as e:
        return Response({
            "Status": "Negative",
            "Message": f"Login error: {str(e)}"
        })


@api_view(["POST"])
def webRegister(request):
    """Register endpoint for web interface with server-side keygen"""
    try:
        name = request.data.get("name")
        username = request.data.get("username")
        password = request.data.get("password")
        
        if not name or not username or not password:
            return Response({
                "Status": "Negative",
                "Message": "Missing name, username, or password"
            })
        
        # Check if username exists
        if Users.objects.filter(username=username).exists():
            return Response({
                "Status": "Negative",
                "Message": "Username already exists"
            })
        
        # Generate Kyber keypair
        public_key, private_key = Kyber512.keygen()
        public_key_b64 = str(base64.b64encode(public_key), encoding="utf-8")
        private_key_b64 = str(base64.b64encode(private_key), encoding="utf-8")
        
        # Hash password
        random_salt = str(base64.b64encode(os.urandom(20)), encoding="utf-8")
        hashed_password = hashlib.sha256(
            str(password + random_salt).encode("utf-8")
        ).hexdigest()
        
        # Create user
        user = Users(
            name=name,
            username=username,
            public_key=public_key_b64,
            private_key=private_key_b64,
            salt=random_salt,
            hashed_password=hashed_password,
        )
        user.save()
        
        return Response({
            "Status": "Positive",
            "Message": "Registration successful",
            "user": {
                "username": username,
                "name": name,
                "public_key": public_key_b64,
                "private_key": private_key_b64,
            }
        })
    except Exception as e:
        return Response({
            "Status": "Negative",
            "Message": f"Registration error: {str(e)}"
        })


@api_view(["GET"])
def getKyberParams(request):
    """Return Kyber512 parameters for visualization"""
    return Response({
        "Status": "Positive",
        "params": {
            "name": "Kyber512",
            "n": 256,
            "k": 2,
            "q": 3329,
            "eta1": 3,
            "eta2": 2,
            "du": 10,
            "dv": 4,
            "description": "Kyber512 is a post-quantum key encapsulation mechanism based on the Module Learning With Errors (MLWE) problem.",
            "security_level": "NIST Level 1 (equivalent to AES-128)",
            "public_key_size": 800,
            "private_key_size": 1632,
            "ciphertext_size": 768,
            "shared_secret_size": 32,
        }
    })
