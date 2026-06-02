---
layout: page
title: 关于
subtitle: 记录生活，记录你
keywords: 关于,雾水
comments: true
menu: 关于
permalink: /about/
---

天生我材必有用，千金散尽还复来。

这里是 **雾水** —— 写代码、看电影，也记录一些半夜想通的小事。像雾、像雨、又像风，慢慢沉淀。

## 联系

<ul>
{% for website in site.data.social %}
<li>{{ website.sitename }}：<a href="{{ website.url }}" target="_blank" rel="noopener">@{{ website.name }}</a></li>
{% endfor %}
</ul>

## 技能关键词

{% for skill in site.data.skills %}
### {{ skill.name }}
<p class="chips">{% for keyword in skill.keywords %}<span class="tag">{{ keyword }}</span>{% endfor %}</p>
{% endfor %}
