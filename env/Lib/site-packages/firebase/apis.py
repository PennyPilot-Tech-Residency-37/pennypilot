from pydantic import BaseModel


class GoogleAPI(BaseModel):
    base_url: str
    version: str

    def url(self, endpoint: str):
        return f"{self.base_url}/{self.version}/{endpoint}"


firebase_remote_config_api = GoogleAPI(
    base_url="https://firebaseremoteconfig.googleapis.com", version="v1"
)
