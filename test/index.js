const test = () => {
    const arr = [1, 0, 0, 2, 4];
    let slow = 0;
    let fast = 0;
    while (fast < arr.length) {
        if (arr[slow] === 0) {
            if (arr[fast] === 0) {
                fast++;
            } else {
                [arr[slow], arr[fast]] = [arr[fast], arr[slow]];
                fast++;
                slow++;
            }
        } else {
            slow++;
            fast++;
        }
    }
    console.log(arr)
    return arr
}
test()