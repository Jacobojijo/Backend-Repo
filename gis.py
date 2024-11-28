container =[
    [5, 3, 2],
    [4, 3, 2],
    [1, 6, 5]
]   
def workon(container):   
    list = []
    sumr = [sum(row) for row in container]
    list.append(sumr)
    print(list)
workon(container)