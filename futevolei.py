#!/usr/bin/env python3
"""
Script para gerar partidas de futevôlei.
- 4 times fixos
- 10 partidas
- Nenhum time espera mais de 2 partidas
- Distribuição equilibrada de jogos
"""

import random
from itertools import combinations

TIMES = {
    1: ("Gregory", "Fernando"),
    2: ("Rafa", "Carlinhos"),
    3: ("Tiago", "Lucas"),
    4: ("Dudu", "Cavalo"),
}

def nome_time(num):
    return f"{TIMES[num][0]}/{TIMES[num][1]}"

def gerar_partidas(num_partidas=10):
    todos_confrontos = list(combinations([1, 2, 3, 4], 2))

    partidas = []
    jogos_por_time = {1: 0, 2: 0, 3: 0, 4: 0}
    ultima_partida = {1: -3, 2: -3, 3: -3, 4: -3}
    confrontos_realizados = {c: 0 for c in todos_confrontos}

    for i in range(num_partidas):
        confrontos_validos = []

        for confronto in todos_confrontos:
            t1, t2 = confronto
            outros = [t for t in [1, 2, 3, 4] if t not in confronto]
            espera_outros = [i - ultima_partida[t] for t in outros]

            if any(e >= 3 for e in espera_outros):
                continue

            confrontos_validos.append(confronto)

        if not confrontos_validos:
            times_esperando = [t for t in [1, 2, 3, 4] if i - ultima_partida[t] >= 3]
            if times_esperando:
                confrontos_validos = [c for c in todos_confrontos if any(t in c for t in times_esperando)]
            else:
                confrontos_validos = list(todos_confrontos)

        def score_confronto(confronto):
            t1, t2 = confronto
            score = confrontos_realizados[confronto] * 10
            score += jogos_por_time[t1] + jogos_por_time[t2]
            score += random.random() * 2
            return score

        confrontos_validos.sort(key=score_confronto)
        confronto_escolhido = confrontos_validos[0]

        partidas.append(confronto_escolhido)
        t1, t2 = confronto_escolhido
        jogos_por_time[t1] += 1
        jogos_por_time[t2] += 1
        ultima_partida[t1] = i
        ultima_partida[t2] = i
        confrontos_realizados[confronto_escolhido] += 1

    return partidas, jogos_por_time, confrontos_realizados

def exibir_resultado(partidas, jogos_por_time, confrontos_realizados):
    print("=" * 60)
    print("        PARTIDAS DE FUTEVÔLEI - QUARTA-FEIRA")
    print("=" * 60)
    print()

    print("TIMES (Direito / Esquerdo):")
    for num, (direito, esquerdo) in TIMES.items():
        print(f"  {direito} / {esquerdo}")
    print()

    print("-" * 60)
    print("CRONOGRAMA DAS PARTIDAS:")
    print("-" * 60)

    for i, (t1, t2) in enumerate(partidas, 1):
        descansando = [t for t in [1, 2, 3, 4] if t not in (t1, t2)]
        print(f"\nPartida {i:2d}:  {nome_time(t1)}  vs  {nome_time(t2)}")
        print(f"            Descansam: {nome_time(descansando[0])} e {nome_time(descansando[1])}")

    print()
    print("-" * 60)
    print("ESTATÍSTICAS:")
    print("-" * 60)

    print("\nJogos por time:")
    for t in sorted(jogos_por_time.keys()):
        print(f"  {nome_time(t)}: {jogos_por_time[t]} jogos")

    print("\nConfrontos realizados:")
    for (t1, t2), qtd in sorted(confrontos_realizados.items()):
        print(f"  {nome_time(t1)} vs {nome_time(t2)}: {qtd}x")

    print("\nVerificação de espera máxima:")
    max_espera = {1: 0, 2: 0, 3: 0, 4: 0}
    ultima = {1: -1, 2: -1, 3: -1, 4: -1}

    for i, (t1, t2) in enumerate(partidas):
        for t in [1, 2, 3, 4]:
            if t in (t1, t2):
                if ultima[t] >= 0:
                    espera = i - ultima[t] - 1
                    max_espera[t] = max(max_espera[t], espera)
                ultima[t] = i

    todas_ok = True
    for t in sorted(max_espera.keys()):
        status = "OK" if max_espera[t] <= 2 else "EXCEDEU!"
        if max_espera[t] > 2:
            todas_ok = False
        print(f"  {nome_time(t)}: máximo {max_espera[t]} partidas esperando - {status}")

    print()
    if todas_ok:
        print("Todas as regras foram respeitadas!")
    else:
        print("ATENÇÃO: Algumas regras não puderam ser respeitadas.")

    print("=" * 60)

def main():
    print()
    partidas, jogos_por_time, confrontos_realizados = gerar_partidas(10)
    exibir_resultado(partidas, jogos_por_time, confrontos_realizados)
    print()
    print("Execute novamente para gerar uma nova combinação aleatória!")
    print()

if __name__ == "__main__":
    main()
