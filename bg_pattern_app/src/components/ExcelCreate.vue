<template>
    <button class="flex bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer items-center">
        <DocumentIcon class="h-5 mr-2"/>
        <span>Excel</span>
    </button>
</template>

<script setup>
    import { DocumentIcon } from '@heroicons/vue/24/solid';
    const props = defineProps({
        title:{
            type:String,
            required:true,
        },
        dataItems: {
            type: Object,
            required: true,
        },
    });
</script>