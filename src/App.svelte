<script lang="ts">
  export let name: string;
  let isVisible: boolean = true;
  import Message from "./components/message/message.svelte";
  // import { addMessage } from "./functions/addMessage";
  import type { messageObject } from "./interfaces/messageObject.interface";
  let messages: messageObject[] = [];
  const addMessage = (event: CustomEvent) => {
    messages = [event.detail, ...messages];
  };

  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  };

  const formatter = new Intl.DateTimeFormat("fr-FR", dateOptions as any);

  const showMenu = () => {
    isVisible = !isVisible;
  };
</script>

<main>
  <h1>Hello {name}!</h1>
  <button on:click={showMenu}> {isVisible?'hide':'show'} </button>
  <br>{#if isVisible}
    <Message on:message={addMessage} />{/if}
  <div>
    <h2>MESSAGES</h2>
    {#each messages as message}
      <div class="custom">
        by {message.author} on {formatter.format(message.date)}
      </div>
      <div>{message.text}</div>
      <hr />
    {/each}
  </div>
</main>

<style lang="scss">
  @import "app.scss";
</style>
