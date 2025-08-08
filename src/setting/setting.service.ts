import { Injectable } from '@nestjs/common';
import { getBaseDB } from '../query-builder/base';
import { SettingColumn } from './dto/setting.dto';

@Injectable()
export class SettingService {
    async getColumns() {
        const result = {}
        const query = getBaseDB().selectFrom('table_column_settings').select(['table_name', 'column_name']).where('is_active', '=', 1); 
        const tmp = query.execute();
        
        (await tmp).forEach((column) => {
            const { table_name, column_name } = column;

            if (!result[table_name]) result[table_name] = [];

            result[table_name].push(column_name);
        });

        return result;
    }

    async postColumns(
        options: SettingColumn[]
    ) {
        const updatePromises = options.map((option) => {
            const {table_name, column_name, is_active} = option;
            const query = getBaseDB().updateTable('table_column_settings').set({

                is_active: is_active,
            }).where('table_name', 'like', table_name).where('column_name', 'like', column_name);

            query.execute();
        });

        await Promise.all(updatePromises);

        return {
            message: 'Columns settings updated successfully',
            updateCount: options.length,
        }
    }

    async updateColumn(
        option: SettingColumn
    ) {
        const {table_name, column_name, is_active} = option;
        const query = getBaseDB().updateTable('table_column_settings').set({

            is_active: is_active,
        }).where('table_name', 'like', table_name).where('column_name', 'like', column_name);

        query.execute();
    }
}
