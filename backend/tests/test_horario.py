from datetime import date, time, timedelta

from app.models.horario import Horario
from app.models.enums import EstadoHorario


def test_genera_numero_correcto_de_franjas():
    # De 08:00 a 12:00 caben 4 franjas de una hora.
    franjas = Horario.generar_franjas(time(8, 0), time(12, 0), dias=1)
    assert len(franjas) == 4


def test_las_franjas_tienen_horas_consecutivas():
    franjas = Horario.generar_franjas(time(8, 0), time(11, 0), dias=1)

    assert franjas[0].hora_inicio == time(8, 0)
    assert franjas[0].hora_fin == time(9, 0)
    assert franjas[1].hora_inicio == time(9, 0)
    assert franjas[2].hora_fin == time(11, 0)


def test_todas_las_franjas_nacen_libres():
    franjas = Horario.generar_franjas(time(8, 0), time(10, 0), dias=1)
    assert all(f.estado == EstadoHorario.LIBRE.value for f in franjas)


def test_franja_incompleta_no_se_incluye():
    # De 08:00 a 09:30 solo cabe UNA franja completa (08:00-09:00);
    # la media hora sobrante no debe generar franja.
    franjas = Horario.generar_franjas(time(8, 0), time(9, 30), dias=1)
    assert len(franjas) == 1
    assert franjas[0].hora_fin == time(9, 0)


def test_rango_menor_a_una_hora_no_genera_franjas():
    franjas = Horario.generar_franjas(time(8, 0), time(8, 30), dias=1)
    assert franjas == []


def test_genera_franjas_para_varios_dias():
    # 3 franjas por dia x 2 dias = 6 franjas.
    franjas = Horario.generar_franjas(time(8, 0), time(11, 0), dias=2)
    assert len(franjas) == 6


def test_las_franjas_usan_la_fecha_de_hoy():
    hoy = date.today()
    franjas = Horario.generar_franjas(time(8, 0), time(10, 0), dias=2)

    fechas = {f.fecha for f in franjas}
    assert hoy in fechas
    assert (hoy + timedelta(days=1)) in fechas
