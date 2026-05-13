import { IDataService } from './interfaces/IDataService';
import { FileBasedDataService } from './implementations/FileBasedDataService';
import { DatabaseDataService } from './implementations/DatabaseDataService';

export type DataSourceType = 'file' | 'database';

export class DataServiceFactory {
  static getDataService(type: DataSourceType = 'database'): IDataService {
    return type === 'file' 
      ? new FileBasedDataService()
      : new DatabaseDataService();
  }
}

// Export a default instance
export const dataService = DataServiceFactory.getDataService('database');

// Export interfaces and implementations for direct usage if needed
export { FileBasedDataService, DatabaseDataService };
export type { IDataService }; 