function timefunc() {
    let now = new Date();
    return `${now.getHours()}:${now.getMinutes()}`
  }

console.log(timefunc());