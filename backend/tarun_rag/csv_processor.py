# ingestion/csv_processor.py
import pandas as pd
from pathlib import Path
from typing import List, Dict
import hashlib

class SimpleCSVProcessor:
    """Simply concatenate all CSV columns into text - no preprocessing"""
    
    def __init__(self, data_dir: str):
        self.data_dir = Path(data_dir)
    
    def row_to_text(self, row: pd.Series) -> str:
        """Convert a row to a single concatenated string"""
        # Just join all non-null values with separator
        parts = []
        for col, value in row.items():
            if pd.notna(value) and str(value).strip():
                parts.append(f"{col}: {value}")
        return " | ".join(parts)
    
    def process_csv(self, filepath: Path, category: str) -> List[Dict]:
        """Process a single CSV file"""
        df = pd.read_csv(filepath)
        documents = []
        
        for idx, row in df.iterrows():
            # Concatenate all columns as-is
            text = self.row_to_text(row)
            
            # Create unique ID
            doc_id = f"{category}_{idx}"
            
            # Extract lat/lon if present (for map features)
            lat = row.get('lat') or row.get('Latitude') or None
            lon = row.get('lon') or row.get('Longitude') or None
            
            documents.append({
                'id': doc_id,
                'category': category,
                'text': text,
                'metadata': row.to_dict(),  # Store entire row as metadata
                'location': {'lat': lat, 'lon': lon}
            })
        
        return documents
    
    def load_all(self) -> List[Dict]:
        """Load all CSV files from data directory"""
        all_documents = []
        
        # Map filenames to categories
        csv_files = {
            'Landmarks_20260124.csv': 'landmarks',
            'Film_Locations_in_San_Francisco_20260124.csv': 'film_locations',
            'StreetSmArts_Murals_20260124.csv': 'murals',
            'restaurants_and_cafes.csv': 'restaurants',
            'parks_and_leisure.csv': 'parks',
            'Recreation_and_Parks_Properties_20260124.csv': 'recreation',
            'buildings.csv': 'buildings',
            'shops.csv': 'shops',
            'transit_stops.csv': 'transit',
        }
        
        for filename, category in csv_files.items():
            filepath = self.data_dir / filename
            if filepath.exists():
                docs = self.process_csv(filepath, category)
                all_documents.extend(docs)
                print(f"Loaded {len(docs)} rows from {filename}")
            else:
                print(f"Skipping {filename} - not found")
        
        print(f"\nTotal documents: {len(all_documents)}")
        return all_documents