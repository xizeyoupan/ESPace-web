<script setup>
import { ref } from 'vue'

const web_version = GIT_VERSION

let latest_tag_name = ''
let sha = ''
let latest_tree = ''


const get_latest_version = async () => {
  let result = await fetch("https://api.github.com/repos/xizeyoupan/magic-wand")
  result = await result.json()
  const repo_id = result.id

  result = await fetch("https://api.github.com/repos/xizeyoupan/magic-wand/releases/latest")
  result = await result.json()
  latest_tag_name = result.tag_name

  result = await fetch(`https://api.github.com/repositories/${repo_id}/git/ref/tags/${latest_tag_name}`)
  result = await result.json()
  sha = result.object.sha.slice(0, 7)

  latest_tree = `https://github.com/xizeyoupan/magic-wand/tree/${sha}`
}
const load_data = async () => {

}
await get_latest_version()


</script>

<template>
  <h2>关于</h2>
  <p>固件版本：</p>
  <p>
    最新版本：
    <a target="_blank" :href="latest_tree">
      {{ `${latest_tag_name} ${sha}` }}
    </a>
  </p>
  <p>编译时间：</p>
  <p>IDF版本：</p>
  <p>
    web版本：
    <a target="_blank" :href="`https://github.com/xizeyoupan/magic-wand-web/tree/${web_version}`">
      {{ web_version }}
    </a>
  </p>
</template>
