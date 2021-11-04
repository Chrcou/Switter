<script lang="ts">
import {
    createEventDispatcher
} from "svelte";


let maxLength = 24;
let author: string;
$: nbChar = message.length;
$: disabled = message.length > maxLength ? true : false;
import type {
    messageObject
} from "../../interfaces/messageObject.interface";
console.log(author);
let message: string = "doudon";
const dispatch = createEventDispatcher();
const saveMessage = (): void => {
    if (message === "") {
        alert("merci de renseigner un message");
    } else {
        const newMessage: messageObject = {
            id: Date.now(),
            text: message,
            author: author || "anonymous",
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
<button on:click={saveMessage} {disabled}> send </button>
<span class:alert={nbChar > 0.8 * maxLength}>{nbChar}</span>
<div>
    <h3>{message}</h3>
</div>
{#if disabled}
<span> Message trop long </span>{/if}

<style lang="scss">
@import "message.scss";
</style>
