<script setup>
import { ref, defineProps, defineEmits } from 'vue';

// Props (входные данные)
const props = defineProps({
  mainItems: {
    type: Array,
    default: () => [],
  },
  utilityItems: {
    type: Array,
    default: () => [],
  },
});


const emit = defineEmits(['main-item-click', 'utility-item-click']);


const selectMainItem = (item) => {
  props.mainItems.forEach((i) => (i.active = false));
  props.utilityItems.forEach((i) => (i.active = false));
  item.active = true;
  emit('main-item-click', item);
};

const selectUtilityItem = (util) => {
  props.mainItems.forEach((i) => (i.active = false));
  props.utilityItems.forEach((i) => (i.active = false));
  util.active = true;
  emit('utility-item-click', util);
};
</script>

<template>
  <div
    class="flex flex-col items-column">
    <!-- ЦЕНТРАЛЬНЫЙ БЛОК (прокручиваемое меню) -->
    <nav class="flex-1 mt-3">
      <ul>
        <li
          v-for="(item, index) in mainItems"
          :key="index"
          :class="[
            'text-base cursor-pointer item',
            item.active? 'active':'',
          ]"
          @click="selectMainItem(item)">
          <p class="item-icon-holder">
            <component
            :is="item.icon"
            class="w-5 h-5 text-gray-500 item-icon" />
          </p>
          <div class="item-label-holder">
            <span class="item-label">{{item.label}}</span>
          </div>
        </li>
      </ul>
    </nav>

    <!-- НИЖНИЙ БЛОК (утилиты) -->
    <nav class="flex-none mt-3">
      <ul>
        <li
          v-for="(item, index) in utilityItems"
          :key="index"
          :class="[
            'text-base cursor-pointer item',
            item.active? 'active':'',
          ]"
          @click="selectUtilityItem(item)">
          <p class="item-icon-holder">
            <component
            :is="item.icon"
            class="w-5 h-5 text-gray-500 item-icon" />
          </p>
          <div class="item-label-holder">
            <span class="item-label">{{item.label}}</span>
          </div>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}
.items-column{
  justify-content: space-between;
    align-items: center;
    width: 72px;
}
.item{
  position: relative;
  margin: 5px 0;
}
.item-icon-holder{
  height: 40px;
  width: 40px;
  background-color: var(--color-blue-600);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  transition: .25s;
}
.item.active .item-icon-holder, .item:hover .item-icon-holder{
    background-color: #2c2933;
}
.item-icon{
    color: #fff;
}
.item-label{
  white-space: nowrap;
}
.item-label-holder{
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  box-shadow: 0 0 2px 3px #0003;
  height: 36px;
  padding: 2px 10px;
  background-color: #fff;
  z-index: 100;
  border-radius: 5px;
  opacity: 0;
  visibility: hidden;
  transition: .5s;
  display: flex;
  align-items: center;
}
.item:hover .item-label-holder {
    left: calc(100% + 18px);
    opacity: 1;
    visibility: visible;
}
.item-label-holder:before {
    content: "";
    position: absolute;
    left: -6px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    width: 10px;
    height: 10px;
    background: #fff;
    box-shadow: 2px -2px 2px 1px #0003 inset;
    z-index: -1;
}
</style>
