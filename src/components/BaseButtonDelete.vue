<template>
  <button class="deleteButton" v-bind="$attrs">
    <svg
      viewBox="0 0 1.625 1.625"
      class="trashIcon"
      height="15"
      width="15"
    >
      <path
        d="M.471 1.024v-.52a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1 0 0 0 .098-.099h-.39c-.107 0-.195 0-.195-.195"
      ></path>
      <path
        d="M1.219.601h-.163A.1.1 0 0 1 .959.504V.341A.033.033 0 0 0 .926.309h-.26a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1 0 0 0 .098-.099v-.39a.033.033 0 0 0-.032-.033"
      ></path>
      <path
        d="m1.245.465-.15-.15a.02.02 0 0 0-.016-.006.023.023 0 0 0-.023.022v.108c0 .036.029.065.065.065h.107a.023.023 0 0 0 .023-.023.02.02 0 0 0-.007-.016"
      ></path>
    </svg>
    <svg
      width="16"
      fill="none"
      viewBox="0 0 39 7"
      class="line1"
    >
      <line class="line1-path1" y2="5" x2="39" y1="5"></line>
      <line
        class="line1-path2"
        y2="1.5"
        x2="26.0357"
        y1="1.5"
        x1="12"
      ></line>
    </svg>
    <svg width="16" fill="none" viewBox="0 0 33 39" class="trashCan">
      <mask fill="white" id="path-1-inside-1_8_19">
        <path
          d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"
        ></path>
      </mask>
      <path
        class="trashCan-path1"
        mask="url(#path-1-inside-1_8_19)"
        d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
      ></path>
      <path class="trashCan-path2" d="M12 6L12 29"></path>
      <path class="trashCan-path3" d="M21 6V29"></path>
    </svg>
  </button>
</template>

<style scoped>
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .deleteButton {
    align-items: center;
    background-color: var(--colour-secondary);
    border: calc(var(--border) * 1.2) solid color-mix(in srgb, var(--colour-secondary-content) 20%, transparent);
    border-radius: var(--radius-input);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    height: var(--spacing-button-small);
    justify-content: center;
    overflow: hidden;
    position: relative;
    transition: background-color 0.3s ease;
    width: var(--spacing-button-small);
  }

  .deleteButton:hover {
    background-color: color-mix(in srgb, var(--colour-error) 80%, var(--colour-base-300));
  }

  .deleteButton:hover .line1 {
    transform: rotate(90deg);
  }

  .deleteButton:hover .line1-path1,
  .deleteButton:hover .line1-path2,
  .deleteButton:hover .trashCan-path1,
  .deleteButton:hover .trashCan-path2,
  .deleteButton:hover .trashCan-path3 {
    fill: var(--colour-error-content);
    stroke: var(--colour-error-content);
  }

  .deleteButton:hover .trashIcon {
    animation: spin 1.4s linear;
    top: 1vw;
  }

  .deleteButton:hover .trashIcon path {
    fill: var(--colour-error-content);
  }

  .deleteButton svg {
    background-color: var(--colour-transparent);
    color: var(--colour-base-100);
  }

  .line1 {
    transform-origin: right;
    transition: transform 0.5s ease;
  }

  .line1-path1 {
    stroke: var(--colour-secondary-content);
    stroke-width: 4;
  }

  .line1-path2 {
    stroke: var(--colour-secondary-content);
    stroke-width: 3;
  }

  .trashCan {
    transition: all 0.3s ease;
  }

  .trashCan-path1 {
    fill: var(--colour-secondary-content);
  }

  .trashCan-path2,
  .trashCan-path3 {
    stroke: var(--colour-secondary-content);
    stroke-width: 4;
  }

  .trashIcon {
    background-color: var(--colour-transparent);
    position: absolute;
    top: -4.2vw;
    transition: top 0.3s ease 0.1s, transform 1s ease 0.1s;
  }

  .trashIcon path {
    fill: var(--colour-base-100);
  }
</style>
