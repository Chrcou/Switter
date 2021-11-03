<script lang="ts">
  export let name: string;
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
</script>

<main>
  <h1>Hello {name}!</h1>
  <Message on:message={addMessage} />
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
