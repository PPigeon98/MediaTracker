<script setup lang="ts">
  import { getCurrentWindow } from '@tauri-apps/api/window';

  async function minimise() {
    await getCurrentWindow().minimize();
  }

  async function maximise() {
    await getCurrentWindow().maximize();
  }

  async function close() {
    await getCurrentWindow().close();
  }
</script>

<template>
  <div class="windowBar">
    <div class="windowBarButtons">
      <button @click="minimise">─</button>
      <button @click="maximise">▢</button>
      <button @click="close">✖</button>
    </div>
    <div class="windowBarTitle">
      <img src="/icon.svg" alt="icon" class="windowBarTitleIconImage">
      Media Tracker
    </div>
  </div>
</template>

<style scoped>
  .windowBar {
    -webkit-app-region: drag;
    background-color: var(--colour-base-300);
    height: var(--window-bar-height);
    left: 0;
    margin-bottom: 0vh;
    position: fixed;
    right: 0;
    top: 0;
    width: 100%;
    z-index: 69420;
  }

  .windowBarButtons {
    -webkit-app-region: no-drag;
    align-items: center;
    display: flex;
    flex-direction: row;
    height: 100%;
    position: absolute;
    right: 0vh;
    top: 0vh;
  }

  .windowBarButtons button {
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    font-size: 1.8vh;
    height: var(--window-bar-height);
    justify-content: center;
    width: 6vh;
  }

  .windowBarButtons button:hover {
    background-color: var(--colour-accent);
  }

  .windowBarTitle {
    align-items: center;
    display: flex;
    gap: 0.5vh;
    height: 100%;
    justify-content: center;
  }

  .windowBarTitleIconImage {
    height: 2vh;
    width: 2vh;
  }

  @media (max-width: 40rem) {
    .windowBarButtons {
      display: none;
    }

    .windowBar {
      padding-top: var(--padding-top-mobile);
    }
  }
</style>
