<script setup lang="ts">
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { useRouter } from 'vue-router'

  const router = useRouter()

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
    <div class="windowBarSettingsButton">
      <button @click="router.push('/Settings')" aria-label="Open settings">⚙</button>
    </div>
    <div class="windowBarGraphButton">
      <button @click="router.push('/Graph')" aria-label="Open graph">🕸</button>
    </div>
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
    box-sizing: border-box;
    height: calc(var(--window-bar-height) + env(safe-area-inset-top, 0px));
    left: 0;
    padding-top: env(safe-area-inset-top, 0px);
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

  .windowBarSettingsButton {
    -webkit-app-region: no-drag;
    align-items: center;
    display: flex;
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
  }

  .windowBarSettingsButton button,
  .windowBarGraphButton button {
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

  .windowBarSettingsButton button:hover,
  .windowBarGraphButton button:hover {
    background-color: var(--colour-accent);
  }

  .windowBarGraphButton {
    -webkit-app-region: no-drag;
    align-items: center;
    display: flex;
    height: 100%;
    left: 6vh;
    position: absolute;
    top: 0;
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
    .windowBarSettingsButton button,
    .windowBarGraphButton button,
    .windowBarButtons button {
      font-size: 2.2vh;
    }

    .windowBarGraphButton {
      left: auto;
      right: 0;
    }

    .windowBarButtons {
      display: none;
    }
  }
</style>
