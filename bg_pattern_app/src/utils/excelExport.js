// src/utils/excelExport.js
import ExcelJS from 'exceljs';

export const exportToExcel = async (data, fileName = 'export.xlsx') => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Отчет');
    
    let currentRow = 1;
    
    // 1. Заголовок
    if (data.title) {
      worksheet.addRow([data.title]);
      worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + data.columns.length)}${currentRow}`);
      currentRow++;
    }
    
    // 2. Строка с фильтрами (период и другие фильтры)
    if (data.filters && data.filters.length > 0) {
      const filterText = data.filters.join(' | ');
      worksheet.addRow([filterText]);
      worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + data.columns.length)}${currentRow}`);
      currentRow++;
    }
    
    // 3. Пустая строка
    worksheet.addRow([]);
    currentRow++;
    
    // 4. Заголовки колонок (как есть из data.columns)
    const headers = data.columns.map(col => col.title);
    worksheet.addRow(headers);
    currentRow++;
    
    // 5. Данные
    const maxRows = Math.max(...data.columns.map(col => col.values.length));
    
    for (let i = 0; i < maxRows; i++) {
      const row = [];
      for (let j = 0; j < data.columns.length; j++) {
        row.push(data.columns[j].values[i] || '');
      }
      worksheet.addRow(row);
      currentRow++;
    }
    if(data.totals && data.totals.length>0){
      const rowLength = data.columns.length
      const row = Array(rowLength).fill('');
      row[0] = "Итого:"
      for(let i = rowLength-data.totals.length,j=0; 
        i<rowLength&&j<data.totals.length;
        i++,j++){

        row[i] = data.totals[j]
      }
      worksheet.addRow(row);
    }
    // 6. Автоширина колонок
    data.columns.forEach((col, idx) => {
      const column = worksheet.getColumn(idx + 1);
      column.width = 20;
    });
    
    // 7. Сохраняем
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    return true;
    
  } catch (error) {
    console.error('Ошибка при создании Excel:', error);
    throw error;
  }
};