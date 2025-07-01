import numpy as np

def gen_matrix(var, cons):
    tab = np.zeros((cons + 1, var + cons + 2))
    return tab

def next_round_r(table):
    m = min(table[:-1, -1])
    if m >= 0:
        return False
    else:
        return True

def next_round(table):
    lr = len(table[:, 0])
    m = min(table[lr - 1, :-1])
    if m >= 0:
        return False
    else:
        return True

def find_neg_r(table):
    lc = len(table[0, :])
    m = min(table[:-1, lc - 1])
    if m <= 0:
        n = np.where(table[:-1, lc - 1] == m)[0][0]
    else:
        n = None
    return n

def find_neg(table):
    lr = len(table[:, 0])
    m = min(table[lr - 1, :-1])
    if m <= 0:
        n = np.where(table[lr - 1, :-1] == m)[0][0]
    else:
        n = None
    return n

def loc_piv_r(table):
    total = []
    r = find_neg_r(table)
    row = table[r, :-1]
    m = min(row)
    c = np.where(row == m)[0][0]
    col = table[:-1, c]
    for i, b in zip(col, table[:-1, -1]):
        if i ** 2 > 0 and b / i > 0:
            total.append(b / i)
        else:
            total.append(10000)
    index = total.index(min(total))
    return [index, c]

def loc_piv(table):
    if next_round(table):
        total = []
        n = find_neg(table)
        for i, b in zip(table[:-1, n], table[:-1, -1]):
            if b / i > 0 and i ** 2 > 0:
                total.append(b / i)
            else:
                total.append(10000)
        index = total.index(min(total))
        return [index, n]

def pivot(row, col, table):
    lr = len(table[:, 0])
    lc = len(table[0, :])
    t = np.zeros((lr, lc))
    pr = table[row, :]
    if table[row, col] ** 2 > 0:
        e = 1 / table[row, col]
        r = pr * e
        for i in range(len(table[:, col])):
            k = table[i, :]
            c = table[i, col]
            if list(k) == list(pr):
                continue
            else:
                t[i, :] = list(k - r * c)
        t[row, :] = list(r)
        return t
    else:
        raise ValueError('Cannot pivot on this element. Pivot value is zero or invalid.')


def convert(eq):
    eq = eq.split(',')
    if 'G' in eq or 'g' in eq:
        g = eq.index('G') if 'G' in eq else eq.index('g')
        del eq[g]
        eq = [float(i) * -1 for i in eq]
        return eq
    if 'L' in eq or 'l' in eq:
        l = eq.index('L') if 'L' in eq else eq.index('l')
        del eq[l]
        eq = [float(i) for i in eq]
        return eq

def convert_min(table):
    table[-1, :-2] = [-1 * i for i in table[-1, :-2]]
    table[-1, -1] = -1 * table[-1, -1]
    return table

def gen_var(table):
    lc = len(table[0, :])
    lr = len(table[:, 0])
    var = lc - lr - 1
    v = []
    for i in range(var):
        v.append('x' + str(i + 1))
    return v

def add_cons(table):
    lr = len(table[:, 0])
    empty = []
    for i in range(lr):
        total = 0
        for j in table[i, :]:
            total += j ** 2
        if total == 0:
            empty.append(total)
    if len(empty) > 1:
        return True
    else:
        return False

def constrain(table, eq):
    if add_cons(table) == True:
        lc = len(table[0, :])
        lr = len(table[:, 0])
        var = lc - lr - 1
        j = 0
        while j < lr:
            row_check = table[j, :]
            total = 0
            for i in row_check:
                total += float(i ** 2)
            if total == 0:
                row = row_check
                break
            j += 1
        eq = convert(eq)
        i = 0
        while i < len(eq) - 1:
            row[i] = eq[i]
            i += 1
        row[-1] = eq[-1]
        row[var + j] = 1
    else:
        print('Cannot add another constraint.')

def add_obj(table):
    lr = len(table[:, 0])
    empty = []
    for i in range(lr):
        total = 0
        for j in table[i, :]:
            total += j ** 2
        if total == 0:
            empty.append(total)
    if len(empty) == 1:
        return True
    else:
        return False

def obj(table, eq):
    if add_obj(table) == True:
        eq = [float(i) for i in eq.split(',')]
        lr = len(table[:, 0])
        row = table[lr - 1, :]
        i = 0
        while i < len(eq) - 1:
            row[i] = eq[i] * -1
            i += 1
        row[-2] = 1
        row[-1] = eq[-1]
    else:
        print('You must finish adding constraints before the objective function can be added.')

def maxz(table):
    max_iterations = 100  # safety cap
    count = 0

    while next_round_r(table):
        if count >= max_iterations:
            print("Max iterations reached in next_round_r loop; stopping to avoid infinite loop.")
            break
        table = pivot(loc_piv_r(table)[0], loc_piv_r(table)[1], table)
        if table is None:
            print("Pivot failed, stopping.")
            break
        count += 1

    count = 0
    while next_round(table):
        if count >= max_iterations:
            print("Max iterations reached in next_round loop; stopping to avoid infinite loop.")
            break
        table = pivot(loc_piv(table)[0], loc_piv(table)[1], table)
        if table is None:
            print("Pivot failed, stopping.")
            break
        count += 1

    # The rest of your return code unchanged
    lc = len(table[0, :])
    lr = len(table[:, 0])
    var = lc - lr - 1
    val = {}
    for i in range(var):
        col = table[:, i]
        s = sum(col)
        m = max(col)
        if float(s) == float(m):
            loc = np.where(col == m)[0][0]
            val[gen_var(table)[i]] = table[loc, -1]
        else:
            val[gen_var(table)[i]] = 0
    val['max'] = table[-1, -1]
    return val


def minz(table):
    table = convert_min(table)
    while next_round_r(table) == True:
        table = pivot(loc_piv_r(table)[0], loc_piv_r(table)[1], table)
    while next_round(table) == True:
        table = pivot(loc_piv(table)[0], loc_piv(table)[1], table)
    lc = len(table[0, :])
    lr = len(table[:, 0])
    var = lc - lr - 1
    val = {}
    for i in range(var):
        col = table[:, i]
        s = sum(col)
        m = max(col)
        if float(s) == float(m):
            loc = np.where(col == m)[0][0]
            val[gen_var(table)[i]] = table[loc, -1]
        else:
            val[gen_var(table)[i]] = 0
    val['min'] = table[-1, -1] * -1
    return val

def main():
    pass  # placeholder if needed later

if __name__ == "__main__":
    m = gen_matrix(2, 2)
    constrain(m, '2,-1,G,10')
    constrain(m, '1,1,L,20')
    obj(m, '5,10,0')
    print(maxz(m))

    m = gen_matrix(2, 4)
    constrain(m, '2,5,G,30')
    constrain(m, '-3,5,G,5')
    constrain(m, '8,3,L,85')
    constrain(m, '-9,7,L,42')
    obj(m, '2,7,0')
    print(minz(m))

    main()
