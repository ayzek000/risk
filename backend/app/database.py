import requests
import os
from typing import Dict, List, Optional
from dotenv import load_dotenv

class SupabaseClient:
    def __init__(self, url: str, key: str):
        self.url = url.rstrip('/')
        self.key = key
        self.headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json'
        }
    
    def select(self, table: str, select: str = '*', filters: Optional[Dict] = None) -> Dict:
        """Выполняет SELECT запрос к таблице"""
        url = f"{self.url}/rest/v1/{table}?select={select}"
        
        if filters:
            for key, value in filters.items():
                url += f"&{key}=eq.{value}"
        
        response = requests.get(url, headers=self.headers)
        return {'data': response.json() if response.status_code == 200 else [], 'error': None if response.status_code == 200 else response.text}
    
    def insert(self, table: str, data: Dict) -> Dict:
        """Выполняет INSERT запрос"""
        url = f"{self.url}/rest/v1/{table}"
        response = requests.post(url, json=data, headers=self.headers)
        return {'data': response.json() if response.status_code == 201 else None, 'error': None if response.status_code == 201 else response.text}
    
    def update(self, table: str, data: Dict, filters: Dict) -> Dict:
        """Выполняет UPDATE запрос"""
        url = f"{self.url}/rest/v1/{table}"
        
        if filters:
            filter_params = []
            for key, value in filters.items():
                filter_params.append(f"{key}=eq.{value}")
            url += "?" + "&".join(filter_params)
        
        response = requests.patch(url, json=data, headers=self.headers)
        return {'data': response.json() if response.status_code == 200 else None, 'error': None if response.status_code == 200 else response.text}
    
    def delete(self, table: str, filters: Dict) -> Dict:
        """Выполняет DELETE запрос"""
        url = f"{self.url}/rest/v1/{table}"
        
        if filters:
            filter_params = []
            for key, value in filters.items():
                filter_params.append(f"{key}=eq.{value}")
            url += "?" + "&".join(filter_params)
        
        response = requests.delete(url, headers=self.headers)
        return {'data': True if response.status_code == 204 else None, 'error': None if response.status_code == 204 else response.text}

# Загружаем переменные окружения
load_dotenv()

# Создаем клиент Supabase
supabase_url = os.getenv('SUPABASE_URL', '')
supabase_key = os.getenv('SUPABASE_ANON_KEY', '')

supabase = SupabaseClient(supabase_url, supabase_key) if supabase_url and supabase_key else None 