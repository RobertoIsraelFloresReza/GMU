package utez.edu.mx.tdsw.config;

import utez.edu.mx.tdsw.models.category.Category;
import utez.edu.mx.tdsw.models.category.CategoryRepository;
import utez.edu.mx.tdsw.models.person.Persons;
import utez.edu.mx.tdsw.models.person.PersonsRepository;
import utez.edu.mx.tdsw.models.role.Role;
import utez.edu.mx.tdsw.models.role.RoleRepository;
import utez.edu.mx.tdsw.models.user.Users;
import utez.edu.mx.tdsw.models.user.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InitialDataService {

    private final RoleRepository roleRepository;
    private final PersonsRepository personsRepository;
    private final UsersRepository usersRepository;
    private final PasswordEncoder encoder;

    private final CategoryRepository categoryRepository;

    @Transactional
    public void initializeRolesAndUsers() {
        Role adminRole = getOrSaveRole(new Role("ADMIN"));
        Role userRole = getOrSaveRole(new Role("DELIVERY_PERSON"));

        createUserWithRole("Nelida", "Baron Perez", "nelidabaron@utez.edu.mx", "usuario01.", adminRole, "7770000001");
        createUserWithRole("Israel", "Flores Reza", "20223TN016@utez.edu.mx", "usuario02.", userRole, "7770000003");
        createUserWithRole("Sebastian", "Quintero Martinez", "20203TN049@utez.edu.mx", "usuario03.", userRole, "7770000004");

        initializeCategories();
    }

    @Transactional
    public void initializeCategories() {
        getOrSaveCategory(new Category("Alimentos"));
        getOrSaveCategory(new Category("Servicios"));
    }

    private void createUserWithRole(String name, String lastName, String email, String password, Role role, String phone) {
        Persons person = getOrSavePersons(new Persons(name, lastName, email, phone, true));
        Users user = getOrSaveUsers(new Users(email, encoder.encode(password), true, person));
        user.setRole(role);
        usersRepository.save(user);
    }

    private Role getOrSaveRole(Role role) {
        return roleRepository.findByName(role.getName())
                .orElseGet(() -> roleRepository.saveAndFlush(role));
    }

    private Persons getOrSavePersons(Persons person) {
        return personsRepository.findByEmail(person.getEmail())
                .orElseGet(() -> personsRepository.saveAndFlush(person));
    }

    private Users getOrSaveUsers(Users user) {
        Optional<Users> foundUser = usersRepository.findByEmail(user.getEmail());
        if (foundUser.isPresent()) return foundUser.get();

        if (user.getPersons() != null && user.getPersons().getIdPerson() == null) {
            user.setPersons(getOrSavePersons(user.getPersons()));
        }

        return usersRepository.saveAndFlush(user);
    }

    private Category getOrSaveCategory(Category category) {
        return categoryRepository.findByName(category.getName())
                .orElseGet(() -> categoryRepository.saveAndFlush(category));
    }
}
