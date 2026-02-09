<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()

  onMounted(() => {
    setTimeout(() => {
      router.push('/home')
    }, 2000)
  })
</script>

<template>
  <div class="splashContainer">
    <div class="content">
      <div class="splashTitleContainer">
        <h1 class="splashTitle">Media Tracker</h1>
      </div>
      <img src="/icon.svg" alt="icon" class="splashImage">
    </div>
  </div>
</template>

<style scoped>
  .splashContainer {
    height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .content {
    position: relative;
    display: flex;

    align-items: center;
    justify-content: center;
  }

  .splashImage {
    background-color: var(--colour-transparent);
    width: 15vw;
    height: 15vw;
    position: absolute;
    animation: slideLeft 1s ease-in-out forwards;
  }

  @keyframes slideLeft {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-20vw);
    }
  }

  .splashTitle {
    font-size: 5vw;
    font-family: 'Lexend', sans-serif;
    font-weight: 700;
    white-space: nowrap;
  }

  .splashTitleContainer {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    overflow: hidden;
    animation: slideIn 1s ease-in-out 0.2s forwards;
    opacity: 0;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      width: 0vw;
      transform: translateX(-10vw);
    }
    to {
      width: 60vw;
      opacity: 1;
      transform: translateX(20vw);
    }
  }
</style>
