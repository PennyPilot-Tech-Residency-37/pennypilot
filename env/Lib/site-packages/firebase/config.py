from typing import Optional, TypeVar, Union, Dict, List
from datetime import datetime, timedelta
import requests
from pydantic import BaseModel
from firebase_admin.credentials import Certificate
from .apis import firebase_remote_config_api
from .util import get_accountKeyPath

T = TypeVar("T")


class RefreshInterval(BaseModel):
    seconds: int

    @classmethod
    def parse_interval(
        cls,
        years: Optional[int] = None,
        days: Optional[int] = None,
        hours: Optional[int] = None,
        minutes: Optional[int] = None,
        seconds: Optional[int] = None,
    ):
        total_seconds = 0
        if years:
            total_seconds += years * 365 * 24 * 60 * 60
        if days:
            total_seconds += days * 24 * 60 * 60
        if hours:
            total_seconds += hours * 60 * 60
        if minutes:
            total_seconds += minutes * 60
        if seconds:
            total_seconds += seconds
        return cls(seconds=total_seconds)


class RemoteConfigAuth(BaseModel):
    project_id: str
    auth_token: str

    @property
    def headers(self) -> dict:
        return {"Authorization": f"Bearer {self.auth_token}"}


class RemoteConfig(BaseModel):
    class RemoteConfigAPI(BaseModel):
        base_url: str
        auth: RemoteConfigAuth

        @classmethod
        def parse_auth(cls, auth: RemoteConfigAuth):
            base_url = firebase_remote_config_api.url(
                f"projects/{auth.project_id}/remoteConfig"
            )
            return cls(base_url=base_url, auth=auth)

        def url(self, endpoint: str):
            return f"{self.base_url}:{endpoint}"

        def download_defaults(self, format: str = "JSON"):
            endpoint = f"downloadDefaults?format={format}"
            url = self.url(endpoint)

            headers = self.auth.headers
            response = requests.get(url, headers=headers)
            data = response.json() if response.ok else None
            return data

    class RefreshManager(BaseModel):
        refresh_interval: RefreshInterval
        last_refreshed: datetime

        def requires_refresh(self):
            now = datetime.now()
            refresh_interval = self.refresh_interval
            seconds = refresh_interval.seconds
            time_since_refresh = now - self.last_refreshed
            return time_since_refresh >= timedelta(seconds=seconds)

    refresh_manager: RefreshManager
    api: RemoteConfigAPI
    data: Union[Dict, List]

    @classmethod
    def init(cls, project_id: str, auth_token: str, refresh_interval: RefreshInterval):
        auth = RemoteConfigAuth(project_id=project_id, auth_token=auth_token)
        api = cls.RemoteConfigAPI.parse_auth(auth=auth)
        data = api.download_defaults()
        last_refreshed = datetime.now()
        refresh_manager = cls.RefreshManager(
            refresh_interval=refresh_interval, last_refreshed=last_refreshed
        )
        return cls(refresh_manager=refresh_manager, api=api, data=data)

    def get(self, key: str, default: T) -> T:
        if self.refresh_manager.requires_refresh():
            data = self.api.download_defaults()
            if data:
                self.data = data
                self.refresh_manager.last_refreshed = datetime.now()
        return self.data.get(key, default)

    @classmethod
    def parse_credentials(
        cls, credentials: Certificate, refresh_interval: RefreshInterval
    ):
        access_token_info = credentials.get_access_token()
        auth_token = access_token_info.access_token
        project_id = credentials.project_id
        return cls.init(
            project_id=project_id,
            auth_token=auth_token,
            refresh_interval=refresh_interval,
        )

    @classmethod
    def parse_accountKeyPath(
        cls, accountKeyPath: str, refresh_interval: RefreshInterval
    ):
        credentials = Certificate(accountKeyPath)
        return cls.parse_credentials(
            credentials=credentials, refresh_interval=refresh_interval
        )

    @classmethod
    def parse_accountKeyName(
        cls, project_dir: str, accountKeyName: str, refresh_interval: RefreshInterval
    ):
        accountKeyPath = get_accountKeyPath(
            root_dir=project_dir, accountKeyName=accountKeyName
        )
        return cls.parse_accountKeyPath(
            accountKeyPath=accountKeyPath, refresh_interval=refresh_interval
        )
