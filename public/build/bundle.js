
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/message/message.svelte generated by Svelte v3.44.1 */

    const { console: console_1 } = globals;
    const file$1 = "src/components/message/message.svelte";

    // (36:0) {#if disabled}
    function create_if_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Message trop long";
    			add_location(span, file$1, 36, 0, 941);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(36:0) {#if disabled}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let input;
    	let t0;
    	let br0;
    	let t1;
    	let textarea;
    	let t2;
    	let br1;
    	let t3;
    	let button;
    	let t4;
    	let t5;
    	let span;
    	let t6;
    	let t7;
    	let div;
    	let h3;
    	let t8;
    	let t9;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let if_block = /*disabled*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			textarea = element("textarea");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			button = element("button");
    			t4 = text("send");
    			t5 = space();
    			span = element("span");
    			t6 = text(/*nbChar*/ ctx[3]);
    			t7 = space();
    			div = element("div");
    			h3 = element("h3");
    			t8 = text(/*message*/ ctx[0]);
    			t9 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(input, "type", "text");
    			add_location(input, file$1, 26, 0, 662);
    			add_location(br0, file$1, 27, 0, 704);
    			attr_dev(textarea, "cols", "50");
    			attr_dev(textarea, "rows", "5");
    			add_location(textarea, file$1, 28, 0, 711);
    			add_location(br1, file$1, 29, 0, 764);
    			button.disabled = /*disabled*/ ctx[2];
    			add_location(button, file$1, 30, 0, 771);
    			attr_dev(span, "class", "svelte-smt5tk");
    			toggle_class(span, "alert", /*nbChar*/ ctx[3] > 0.8 * /*maxLength*/ ctx[4]);
    			add_location(span, file$1, 31, 0, 829);
    			add_location(h3, file$1, 33, 4, 900);
    			add_location(div, file$1, 32, 0, 890);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*author*/ ctx[1]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*message*/ ctx[0]);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span, anchor);
    			append_dev(span, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t8);
    			insert_dev(target, t9, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[7]),
    					listen_dev(button, "click", /*saveMessage*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*author*/ 2 && input.value !== /*author*/ ctx[1]) {
    				set_input_value(input, /*author*/ ctx[1]);
    			}

    			if (dirty & /*message*/ 1) {
    				set_input_value(textarea, /*message*/ ctx[0]);
    			}

    			if (dirty & /*disabled*/ 4) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[2]);
    			}

    			if (dirty & /*nbChar*/ 8) set_data_dev(t6, /*nbChar*/ ctx[3]);

    			if (dirty & /*nbChar, maxLength*/ 24) {
    				toggle_class(span, "alert", /*nbChar*/ ctx[3] > 0.8 * /*maxLength*/ ctx[4]);
    			}

    			if (dirty & /*message*/ 1) set_data_dev(t8, /*message*/ ctx[0]);

    			if (/*disabled*/ ctx[2]) {
    				if (if_block) ; else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(textarea);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t9);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let nbChar;
    	let disabled;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Message', slots, []);
    	let maxLength = 24;
    	let author;
    	console.log(author);
    	let message = "doudon";
    	const dispatch = createEventDispatcher();

    	const saveMessage = () => {
    		if (message === "") {
    			alert("merci de renseigner un message");
    		} else {
    			const newMessage = {
    				id: Date.now(),
    				text: message,
    				author: author || "anonymous",
    				date: new Date()
    			};

    			dispatch("message", newMessage);
    			$$invalidate(0, message = "");
    			$$invalidate(1, author = "");
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Message> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		author = this.value;
    		$$invalidate(1, author);
    	}

    	function textarea_input_handler() {
    		message = this.value;
    		$$invalidate(0, message);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		maxLength,
    		author,
    		message,
    		dispatch,
    		saveMessage,
    		disabled,
    		nbChar
    	});

    	$$self.$inject_state = $$props => {
    		if ('maxLength' in $$props) $$invalidate(4, maxLength = $$props.maxLength);
    		if ('author' in $$props) $$invalidate(1, author = $$props.author);
    		if ('message' in $$props) $$invalidate(0, message = $$props.message);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ('nbChar' in $$props) $$invalidate(3, nbChar = $$props.nbChar);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*message*/ 1) {
    			$$invalidate(3, nbChar = message.length);
    		}

    		if ($$self.$$.dirty & /*message*/ 1) {
    			$$invalidate(2, disabled = message.length > maxLength ? true : false);
    		}
    	};

    	return [
    		message,
    		author,
    		disabled,
    		nbChar,
    		maxLength,
    		saveMessage,
    		input_input_handler,
    		textarea_input_handler
    	];
    }

    class Message extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Message",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.1 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (26:6) {#if isVisible}
    function create_if_block(ctx) {
    	let message;
    	let current;
    	message = new Message({ $$inline: true });
    	message.$on("message", /*addMessage*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(message.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(message, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(message.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(message.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(message, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(26:6) {#if isVisible}",
    		ctx
    	});

    	return block;
    }

    // (30:4) {#each messages as message}
    function create_each_block(ctx) {
    	let div0;
    	let t0;
    	let t1_value = /*message*/ ctx[7].author + "";
    	let t1;
    	let t2;
    	let t3_value = /*formatter*/ ctx[4].format(/*message*/ ctx[7].date) + "";
    	let t3;
    	let t4;
    	let div1;
    	let t5_value = /*message*/ ctx[7].text + "";
    	let t5;
    	let t6;
    	let hr;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("by ");
    			t1 = text(t1_value);
    			t2 = text(" on ");
    			t3 = text(t3_value);
    			t4 = space();
    			div1 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			hr = element("hr");
    			attr_dev(div0, "class", "custom svelte-10b55yt");
    			add_location(div0, file, 30, 6, 753);
    			add_location(div1, file, 33, 6, 857);
    			add_location(hr, file, 34, 6, 889);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, hr, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*messages*/ 4 && t1_value !== (t1_value = /*message*/ ctx[7].author + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*messages*/ 4 && t3_value !== (t3_value = /*formatter*/ ctx[4].format(/*message*/ ctx[7].date) + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*messages*/ 4 && t5_value !== (t5_value = /*message*/ ctx[7].text + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(hr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(30:4) {#each messages as message}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let button;
    	let t4_value = (/*isVisible*/ ctx[1] ? 'hide' : 'show') + "";
    	let t4;
    	let t5;
    	let br;
    	let t6;
    	let div;
    	let h2;
    	let t8;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*isVisible*/ ctx[1] && create_if_block(ctx);
    	let each_value = /*messages*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			t0 = text("Hello ");
    			t1 = text(/*name*/ ctx[0]);
    			t2 = text("!");
    			t3 = space();
    			button = element("button");
    			t4 = text(t4_value);
    			t5 = space();
    			br = element("br");
    			if (if_block) if_block.c();
    			t6 = space();
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "MESSAGES";
    			t8 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "svelte-10b55yt");
    			add_location(h1, file, 23, 2, 528);
    			add_location(button, file, 24, 2, 553);
    			add_location(br, file, 25, 2, 620);
    			add_location(h2, file, 28, 4, 697);
    			add_location(div, file, 27, 2, 687);
    			attr_dev(main, "class", "svelte-10b55yt");
    			add_location(main, file, 22, 0, 519);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(main, t3);
    			append_dev(main, button);
    			append_dev(button, t4);
    			append_dev(main, t5);
    			append_dev(main, br);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t6);
    			append_dev(main, div);
    			append_dev(div, h2);
    			append_dev(div, t8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*showMenu*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);
    			if ((!current || dirty & /*isVisible*/ 2) && t4_value !== (t4_value = (/*isVisible*/ ctx[1] ? 'hide' : 'show') + "")) set_data_dev(t4, t4_value);

    			if (/*isVisible*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*isVisible*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, t6);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*messages, formatter*/ 20) {
    				each_value = /*messages*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;
    	let isVisible = true;
    	let messages = [];

    	const addMessage = event => {
    		$$invalidate(2, messages = [event.detail, ...messages]);
    	};

    	const dateOptions = {
    		weekday: "long",
    		year: "numeric",
    		month: "long",
    		day: "numeric",
    		hour: "numeric",
    		minute: "2-digit",
    		second: "2-digit"
    	};

    	const formatter = new Intl.DateTimeFormat("fr-FR", dateOptions);

    	const showMenu = () => {
    		$$invalidate(1, isVisible = !isVisible);
    	};

    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		name,
    		isVisible,
    		Message,
    		messages,
    		addMessage,
    		dateOptions,
    		formatter,
    		showMenu
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('isVisible' in $$props) $$invalidate(1, isVisible = $$props.isVisible);
    		if ('messages' in $$props) $$invalidate(2, messages = $$props.messages);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, isVisible, messages, addMessage, formatter, showMenu];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: "Switter",
        },
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
