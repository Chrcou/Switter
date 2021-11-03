<script lang="ts">
  import { createEventDispatcher } from "svelte";

  let author: string = "";
  import type { messageObject } from "../../interfaces/messageObject.interface";
  console.log(author);
  let message: string = "doudon";
  const dispatch = createEventDispatcher();
  const saveMessage = (): void => {
    if (author === "" || message === "") {
      alert("merci de renseigner un message et un auteur");
    } else {
      const newMessage: messageObject = {
        id: Date.now(),
        text: message,
        author: author,
        date: new Date(),
      };
      dispatch("message", newMessage);
      message = "";
      author = "";
    }
  };
</script>

<input type="text" bind:value={author} />
<br />
<textarea cols="50" rows="5" bind:value={message} />
<br />
<button on:click={saveMessage}> send </button>
<div>
  <h3>{message}</h3>
</div>

<style></style>
