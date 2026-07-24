import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Cancha } from '../../../core/models/cancha.model';
import { CanchaService } from '../../../core/services/cancha.service';
import { CanchaForm } from './cancha-form';

const CANCHA: Cancha = {
  id: 7,
  nombre: 'Cancha Norte',
  tipo: 'futbol7',
  precio_hora: 35,
  hora_apertura: '09:00',
  hora_cierre: '21:00',
  promedio_calificacion: 4.2,
  activa: true,
};

const VALORES_POR_DEFECTO = {
  nombre: '',
  tipo: 'futbol5',
  precio_hora: 20,
  hora_apertura: '08:00',
  hora_cierre: '22:00',
};

describe('CanchaForm', () => {
  let fixture: ComponentFixture<CanchaForm>;
  let componente: CanchaForm;
  let canchaService: jasmine.SpyObj<Pick<CanchaService, 'crear' | 'editar'>>;

  beforeEach(async () => {
    canchaService = jasmine.createSpyObj('CanchaService', ['crear', 'editar']);
    canchaService.crear.and.returnValue(of(CANCHA));
    canchaService.editar.and.returnValue(of(CANCHA));

    TestBed.configureTestingModule({
      imports: [CanchaForm],
      providers: [{ provide: CanchaService, useValue: canchaService }],
    });

    TestBed.overrideComponent(CanchaForm, { set: { template: '' } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(CanchaForm);
    componente = fixture.componentInstance;
  });

  function llenarFormulario(): void {
    componente.form.setValue({
      nombre: 'Cancha Sur',
      tipo: 'futbol11',
      precio_hora: 50,
      hora_apertura: '07:00',
      hora_cierre: '23:00',
    });
  }

  it('se crea con los valores por defecto y sin guardar en curso', () => {
    expect(componente).toBeTruthy();
    expect(componente.form.getRawValue()).toEqual(VALORES_POR_DEFECTO);
    expect(componente.guardando).toBeFalse();
    expect(componente.errorGuardado).toBeNull();
  });

  describe('tipos (etiquetaTipo)', () => {
    it('traduce cada tipo técnico a su etiqueta legible', () => {
      expect(componente.tipos).toEqual([
        { label: 'Fútbol 5', value: 'futbol5' },
        { label: 'Fútbol 7', value: 'futbol7' },
        { label: 'Fútbol 11', value: 'futbol11' },
      ]);
    });
  });

  describe('esEdicion', () => {
    it('es false cuando no se recibe cancha', () => {
      fixture.detectChanges();

      expect(componente.esEdicion).toBeFalse();
    });

    it('es true cuando se recibe una cancha', () => {
      fixture.componentRef.setInput('cancha', CANCHA);
      fixture.detectChanges();

      expect(componente.esEdicion).toBeTrue();
    });
  });

  describe('efecto de apertura del diálogo', () => {
    it('no toca el formulario mientras el diálogo está cerrado', () => {
      componente.form.patchValue({ nombre: 'texto a medio escribir' });
      fixture.detectChanges();

      expect(componente.form.controls.nombre.value).toBe('texto a medio escribir');
    });

    it('carga los datos de la cancha al abrirse en modo edición', () => {
      fixture.componentRef.setInput('cancha', CANCHA);
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();

      expect(componente.form.getRawValue()).toEqual({
        nombre: CANCHA.nombre,
        tipo: CANCHA.tipo,
        precio_hora: CANCHA.precio_hora,
        hora_apertura: CANCHA.hora_apertura,
        hora_cierre: CANCHA.hora_cierre,
      });
    });

    it('restablece los valores por defecto al abrirse en modo creación', () => {
      componente.form.patchValue({ nombre: 'residuo anterior', precio_hora: 999 });

      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();

      expect(componente.form.getRawValue()).toEqual(VALORES_POR_DEFECTO);
    });

    it('limpia el error de guardado anterior al reabrirse', () => {
      componente.errorGuardado = 'error viejo';

      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();

      expect(componente.errorGuardado).toBeNull();
    });

    it('no vuelve a resetear el formulario mientras el diálogo sigue abierto', () => {
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();

      componente.form.patchValue({ nombre: 'escribiendo...' });
      fixture.detectChanges();

      expect(componente.form.controls.nombre.value).toBe('escribiendo...');
    });

    it('vuelve a resetear el formulario tras cerrar y reabrir', () => {
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();
      componente.form.patchValue({ nombre: 'escribiendo...' });

      fixture.componentRef.setInput('visible', false);
      fixture.detectChanges();
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();

      expect(componente.form.getRawValue()).toEqual(VALORES_POR_DEFECTO);
    });
  });

  describe('validaciones del formulario', () => {
    it('nace inválido porque el nombre viene vacío', () => {
      expect(componente.form.invalid).toBeTrue();
      expect(componente.form.controls.nombre.hasError('required')).toBeTrue();
    });

    it('es válido en cuanto se completa el nombre', () => {
      componente.form.controls.nombre.setValue('Cancha Sur');

      expect(componente.form.valid).toBeTrue();
    });

    it('exige un nombre de al menos 3 caracteres', () => {
      componente.form.controls.nombre.setValue('AB');

      expect(componente.form.controls.nombre.hasError('minlength')).toBeTrue();
    });

    it('rechaza un precio por hora de 0', () => {
      componente.form.controls.precio_hora.setValue(0);

      expect(componente.form.controls.precio_hora.hasError('min')).toBeTrue();
    });

    it('rechaza horas vacías', () => {
      componente.form.controls.hora_apertura.setValue('');
      componente.form.controls.hora_cierre.setValue('');

      expect(componente.form.controls.hora_apertura.hasError('required')).toBeTrue();
      expect(componente.form.controls.hora_cierre.hasError('required')).toBeTrue();
    });
  });

  describe('onSubmit', () => {
    it('no llama al servicio si el formulario es inválido y marca los campos', () => {
      componente.form.controls.nombre.setValue('AB');

      componente.onSubmit();

      expect(canchaService.crear).not.toHaveBeenCalled();
      expect(canchaService.editar).not.toHaveBeenCalled();
      expect(componente.form.controls.nombre.touched).toBeTrue();
    });

    it('crea la cancha cuando no hay cancha en edición', () => {
      fixture.detectChanges();
      llenarFormulario();

      componente.onSubmit();

      expect(canchaService.crear).toHaveBeenCalledOnceWith({
        nombre: 'Cancha Sur',
        tipo: 'futbol11',
        precio_hora: 50,
        hora_apertura: '07:00',
        hora_cierre: '23:00',
      });
      expect(canchaService.editar).not.toHaveBeenCalled();
    });

    it('edita usando el id de la cancha recibida', () => {
      fixture.componentRef.setInput('cancha', CANCHA);
      fixture.detectChanges();
      llenarFormulario();

      componente.onSubmit();

      expect(canchaService.editar).toHaveBeenCalledOnceWith(CANCHA.id, jasmine.any(Object));
      expect(canchaService.crear).not.toHaveBeenCalled();
    });

    it('emite guardado y apaga el indicador tras un guardado exitoso', () => {
      const emitido = jasmine.createSpy('guardado');
      componente.guardado.subscribe(emitido);
      fixture.detectChanges();
      llenarFormulario();

      componente.onSubmit();

      expect(emitido).toHaveBeenCalledTimes(1);
      expect(componente.guardando).toBeFalse();
      expect(componente.errorGuardado).toBeNull();
    });

    it('muestra el detalle que devuelve el backend cuando falla', () => {
      canchaService.crear.and.returnValue(
        throwError(() => ({ error: { detail: 'La hora de cierre debe ser mayor' } })),
      );
      const emitido = jasmine.createSpy('guardado');
      componente.guardado.subscribe(emitido);
      fixture.detectChanges();
      llenarFormulario();

      componente.onSubmit();

      expect(componente.errorGuardado).toBe('La hora de cierre debe ser mayor');
      expect(componente.guardando).toBeFalse();
      expect(emitido).not.toHaveBeenCalled();
    });

    it('muestra un mensaje genérico si el error no trae detalle', () => {
      canchaService.crear.and.returnValue(throwError(() => ({ status: 500 })));
      fixture.detectChanges();
      llenarFormulario();

      componente.onSubmit();

      expect(componente.errorGuardado).toBe(
        'No se pudo guardar la cancha. Verifica los datos ingresados.',
      );
    });
  });

  describe('cancelado', () => {
    it('expone una salida para que el contenedor cierre el diálogo', () => {
      const emitido = jasmine.createSpy('cancelado');
      componente.cancelado.subscribe(emitido);

      componente.cancelado.emit();

      expect(emitido).toHaveBeenCalledTimes(1);
    });
  });
});
