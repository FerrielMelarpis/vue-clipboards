/**
 * @author: 卓文理
 * @email : 531840344@qq.com
 * @desc  : VueClipboard
 */

import Clipboard from 'clipboard';

if (!Clipboard) {
    throw new Error('[vue-clipboards] cannot locate Clipboard.');
}

function isDom (obj) {
    return typeof window.HTMLElement === 'object'
        ? obj instanceof window.HTMLElement
        : obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
}

export default function (Vue) {
    Vue.directive('clipboard', {
        async bind (el, { value }, vnode) {
            const option = {};
            let $parent = null;
            let text = value;

            if (text) {
                if (typeof text === 'function') {
                    text = await value();
                }

                if (/(string|number)/.test(typeof text)) {
                    option.text = () => text;
                } else {
                    throw new Error('[vue-clipboards] Invalid value. Please use a valid value.');
                }
            }

            if (vnode.data.attrs && vnode.data.attrs.model) {
                $parent = isDom(vnode.data.attrs.model)
                        ? vnode.data.attrs.model
                        : document.querySelector(vnode.data.attrs.model);
            }

            // 修复按钮脱离文档流时，clipboard监听失败问题
            if (vnode.elm.offsetParent) {
                option.container = vnode.elm.offsetParent;
            } else if (isDom($parent)) {
                option.container = $parent;
            } else {
                // if root element should use document.body
                option.container = el.parentElement || document.body;
            }

            vnode.elm.$clipboards = new Clipboard(el, option);

            const { componentOptions, data } = vnode;
            const listeners = componentOptions ? componentOptions.listeners : null;
            const on = data ? data.on : null;
            const events = (listeners && listeners) || (on && on);

            if (events && typeof events === 'object' && Object.keys(events).length) {
                // fixed with Vue 2.2.x, event object `fn` rename to `fns`
                Object.keys(events).map(
                    cb => vnode.elm.$clipboards.on(cb, events[cb].fn || events[cb].fns)
                );
            }

            return vnode.elm.$clipboards;
        },
        unbind (vnode) {
            if (vnode.elm && vnode.elm.$clipboards && vnode.elm.$clipboards.destroy) {
                vnode.elm.$clipboards.destroy();
                delete vnode.elm.$clipboards;
            }
        },
        update (el, binding, vnode) {
            binding.def.unbind(vnode);
            binding.def.bind(el, binding, vnode);
        }
    });
}
