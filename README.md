<img src="https://kekse.biz/github.php?draw&override=github:dump" />

# The **`dump`** utility
My own **Radix viewer/editor**.

## Index
* [Introduction](#introduction)
	* [First words](#first-words)
	* [Example Screenshot](#example-screenshot)
* [Download](#download)
	* [Structure](#structure)
	* [Infra-Structure](#infra-structure)
* [References](#references)
* [Copyright and License](#copyright-and-license)

## Introduction
It became necessary since I wanted to inspect the changing data of my [Norbert](https://github.com/kekse1/norbert/).

### First words
It's more than a **Hex viewer**.. it's rather a **Radix viewer**; which will become a **Radix Editor** in some
time. I'm working on it just a little bit right now, since it's not the most important project for my purposes.
But it became necessary, so I invented it.

> [!TIP]
> JFYI: **Radix** is my word for a numeric **base**. The **decimal** system with base **10**,
> **hexadecimal** with **16**, or **binary** with **2**.
> So this project aim's to let you see input/file data in a specificly converted view.

I found out such a code like it's also the [**`hexyl`**](https://github.com/sharkdp/hexyl/) is really easy. Don't
know exactly how hard this will get when I will extend it (got a big TODO for this one). But it was a cake of piece
until now.

### Example Screenshot
This is a **first preview** screenshot.
![First Screenshot](img/screenshot.eins.png)

And this is a newer one, with less extensions and a newly configured [configuration](./src/json/config.json),
mostly with better colorization, plus the feature to not insist on a simple replacement character for
non-printable or ANSI characters, but to draw a radix converted view on it - whereas I'd like to use
the `2` to let the user see if the byte is even or odd. ;-)
![Second Screenshot](img/screenshot.zwei.png)

My latest feature: I wanted to analyse some abstract complexity in my A.I. header data by looking at it in binary,
by doing a modulo operation. To directly see the structure or any abnormality or similarity or smth. like it, the
last thing was to colorize the bits (other bases also possible..). That's the result (and I really figured my
problem out):
![Third Screenshot](img/screenshot.drei.png)

Extended the latest feature to see kinda **heatmap**. Just start with both paramters `--replace 256 --heat`; this
way I really saw how much my values are distributed over the header data! **:-D**
![Fourth Screenshot](img/screenshot.vier.png)

## Download
You can download it by browsing the [**`./src/`**](./src/). It's a [`Node.js`](https://nodejs.org/) **sub** project.

### Structure
* [**`js/`**](./src/js/): the real runtime code; one **startup** script (for the `numb.sh`) and one with the real logic implementation;
* [**`json/`**](./src/json/): the configuration file and a scheme file for the argv parameters; also depends on more code;
* [**`sh/`**](./src/sh/): a **startup** (bash) shell script; I'm always using such scripts massively (to better prepare the environment);

I **think** in the future I'll also provide an easy setup/install script. But not for now. We'll see..

Additionally, my [configuration `.json` file](./src/json/config.json) will have a better structure. It all was quick-and-easy setup for me,
but the more config parameters will come, the more structure they need .. and gonna have.

> [!TIP]
> I'm using my `.json` configuration with the help of my
> [**`config.js`**](https://github.com/kekse1/javascript/#configjs).

> [!TIP]
> I'm also using my own [**`JSON.js`**](https://github.com/kekse1/json.js/) project in here.
> This is why you can see the comments in my [`config.json`](./src/json/config.json).

### Infra-Structure
> [!IMPORTANT]
> This project relies on my own JavaScript infrastructure.

So you can only see the code of this **sub** project. It doesn't really run stand-alone.

If you'd like to use it, you could bring in your own **polyfill**. .. in case you don't
want to wait until I'm going to run my
[**`init-sub-proj.sh`**](https://github.com/kekse1/scripts/?tab=readme-ov-file#init-sub-projsh).

## References
* [`hexyl`](https://github.com/sharkdp/hexyl/)

I mention this project here because I often used it before I came up with my own solution.

In the future, when I'm extending this code base, I think I'm going to see this foreign
project as an example for me. Like more colors for different types of byte data, and more.

# Copyright and License
The Copyright is [(c) Sebastian Kucharczyk](./COPYRIGHT.txt),
and it's licensed under the [MIT](./LICENSE.txt) (also known as 'X' or 'X11' license).

<a href="favicon.512px.png" target="_blank">
<img src="favicon.png" alt="Favicon" />
</a>

