<template>
    <button 
      @click="handleExport"
      class="flex bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer items-center"
      :disabled="!hasData">
      <DocumentIcon class="h-5 mr-2"/>
      <span>Excel</span>
    </button>
  </template>
  
  <script setup>
  import { DocumentIcon } from '@heroicons/vue/24/solid';
  import { computed } from 'vue';
  import { exportToExcel } from '../utils/excelExport.js';
  
  const props = defineProps({
    excelData: { 
      type: Object,
      required: true
    },
    fileName: {
      type: String,
      default: ''
    }
  });
  
  const emit = defineEmits(['export', 'error']);
  
  const hasData = computed(() => 
    props.excelData?.columns?.some(col => col.values?.length > 0)
  );
  
  const handleExport = async () => {
    if (!hasData.value) {
      emit('error', 'Нет данных для экспорта');
      return;
    }
  
    try {
      const fileName = props.fileName || 
        `${props.excelData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      await exportToExcel(props.excelData, fileName);
      
      emit('export', { 
        success: true, 
        fileName, 
        columnsCount: props.excelData.columns.length,
        itemsCount: props.excelData.columns[0].values.length
      });
      
    } catch (error) {
      console.error('Ошибка экспорта в Excel:', error);
      emit('error', error.message);
    }
  };
  </script>